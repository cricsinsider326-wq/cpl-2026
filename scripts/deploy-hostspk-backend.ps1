param(
  [string]$UserName,
  [string]$Password,
  [string[]]$OnlyFiles,
  [switch]$CriticalOnly,
  [switch]$Full,
  [switch]$ExtractArchives
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Project = Resolve-Path (Join-Path $PSScriptRoot "..")
$Dist = Join-Path $Project "dist"
$Base = "https://cp.hostspk.com"
$Service = "1bd4e8e59a8b1bc6"
$RemoteHome = "/home/sites/42b/8/8a7936cbd5"
$Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$script:FileManagerPackageId = $null

if (-not $UserName) { $UserName = Read-Host "HostSPK username" }
if (-not $Password) {
  $SecurePassword = Read-Host "HostSPK password" -AsSecureString
  $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
  )
}

function Get-Inputs($Html) {
  $Fields = @{}
  foreach ($Match in [regex]::Matches($Html, "<input[^>]+>", "IgnoreCase")) {
    $Tag = $Match.Value
    $Name = [regex]::Match($Tag, "name=[""']([^""']+)[""']", "IgnoreCase").Groups[1].Value
    $Value = [regex]::Match($Tag, "value=[""']([^""']*)[""']", "IgnoreCase").Groups[1].Value
    if ($Name) { $Fields[$Name] = [System.Net.WebUtility]::HtmlDecode($Value) }
  }
  $Fields
}

function Post-Form($Url, $Body, $Headers = $null) {
  $LastError = $null
  foreach ($Attempt in 1..4) {
    try {
      return Invoke-WebRequest `
        -Uri $Url `
        -Method Post `
        -WebSession $Session `
        -Body $Body `
        -ContentType "application/x-www-form-urlencoded; charset=UTF-8" `
        -Headers $Headers `
        -TimeoutSec 45 `
        -UseBasicParsing
    } catch {
      $LastError = $_
      if ($Attempt -lt 4) {
        Write-Warning "HostSPK request failed (attempt $Attempt/4). Retrying..."
        Start-Sleep -Seconds ([Math]::Min(8, $Attempt * 2))
      }
    }
  }
  throw $LastError
}

function Assert-FileManagerSuccess($Response, $Action, [switch]$AllowExists) {
  if (-not $Response) { throw "HostSPK $Action returned no response." }
  $Body = [string]$Response.Content
  if (-not $Body) { return }
  try {
    $Json = $Body | ConvertFrom-Json
  } catch {
    return
  }
  if ($null -ne $Json.success -and -not [bool]$Json.success) {
    if ($AllowExists -and $Body -match "exist|already") { return }
    throw "HostSPK $Action failed: $Body"
  }
}

function Get-FileManagerHeaders {
  $Login = Invoke-WebRequest -Uri "$Base/login?r=/services/$Service/file-manager" -WebSession $Session -TimeoutSec 45 -UseBasicParsing
  $Form = Get-Inputs $Login.Content
  $Form["username"] = $UserName
  $Form["password"] = $Password
  $Form["r"] = "/services/$Service/file-manager"

  try {
    Post-Form "$Base/login/authenticate" $Form | Out-Null
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -notin 301, 302, 303) { throw }
  }

  $FileManager = Invoke-WebRequest -Uri "$Base/services/$Service/file-manager" -WebSession $Session -TimeoutSec 45 -UseBasicParsing
  if ($FileManager.BaseResponse.ResponseUri.AbsoluteUri -like "*basket-summary-login*") {
    throw "Login did not reach File Manager."
  }

  $Html = $FileManager.Content
  $script:FileManagerPackageId = ([regex]::Match($Html, 'page\.init\(["'']([^"'']+)["'']\)', 'IgnoreCase')).Groups[1].Value
  if (-not $script:FileManagerPackageId) {
    throw "Could not find the HostSPK File Manager package id."
  }
  $CsrfName = ([regex]::Match($Html, "<meta[^>]+name=[""']Csrf-Name[""'][^>]+content=[""']([^""']+)[""']", "IgnoreCase")).Groups[1].Value
  $CsrfValue = ([regex]::Match($Html, "<meta[^>]+name=[""']Csrf-Value[""'][^>]+content=[""']([^""']+)[""']", "IgnoreCase")).Groups[1].Value
  if (-not $CsrfName) {
    $CsrfName = ([regex]::Match($Html, "setRequestHeader\(""Csrf-Name"",\s*""([^""]+)""\)", "IgnoreCase")).Groups[1].Value
  }
  if (-not $CsrfValue) {
    $CsrfValue = ([regex]::Match($Html, "setRequestHeader\(""Csrf-Value"",\s*""([^""]+)""\)", "IgnoreCase")).Groups[1].Value
  }
  if (-not $CsrfName -or -not $CsrfValue) {
    throw "Could not find File Manager CSRF headers."
  }

  @{
    "Csrf-Name" = $CsrfName
    "Csrf-Value" = $CsrfValue
    "X-Requested-With" = "XMLHttpRequest"
    "Accept" = "application/json, text/javascript, */*; q=0.01"
    "Referer" = "$Base/services/$Service/file-manager"
  }
}

function Save-RemoteBinaryFile($LocalFile, $RemoteFile, $Headers) {
  Add-Type -AssemblyName System.Net.Http
  Write-Output "Preparing binary upload: $RemoteFile"

  $Bytes = [System.IO.File]::ReadAllBytes($LocalFile)
  $ChunkSize = 1024 * 1000 * 10
  $TotalChunks = [Math]::Ceiling($Bytes.Length / $ChunkSize)
  $UploadSession = [Guid]::NewGuid().ToString("N")
  $Name = [System.IO.Path]::GetFileName($LocalFile)
  $StagedName = "$Name|::|$script:FileManagerPackageId|::|$UploadSession|::|1"
  $StagedTmp = "$Name|::|$script:FileManagerPackageId|::|$UploadSession"

  # Remove a previous copy so the final File Manager publish is deterministic.
  try {
    Post-Form "$Base/a/services/$Service/file-manager-platform/delete" `
      @{ action = "delete"; "files[]" = $RemoteFile } $Headers | Out-Null
  } catch {
    # A missing destination is expected on the first upload.
  }

  $Handler = New-Object System.Net.Http.HttpClientHandler
  $Handler.CookieContainer = $Session.Cookies
  $Handler.UseCookies = $true
  $Client = New-Object System.Net.Http.HttpClient($Handler)
  try {
    foreach ($Header in $Headers.GetEnumerator()) {
      [void]$Client.DefaultRequestHeaders.TryAddWithoutValidation($Header.Key, [string]$Header.Value)
    }

    $Payload = [System.Net.Http.ByteArrayContent]::new([byte[]]$Bytes)
    $Payload.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream")
    $Multipart = New-Object System.Net.Http.MultipartFormDataContent
    $Multipart.Add($Payload, "fileUpload", $StagedName)
    $Client.Timeout = [TimeSpan]::FromSeconds(60)
    Write-Output "Uploading binary chunk: $RemoteFile"
    $ChunkResponse = $Client.PostAsync("$Base/a/services/$Service/file-manager-upload", $Multipart).Result
    $ChunkBody = $ChunkResponse.Content.ReadAsStringAsync().Result
    if (-not $ChunkResponse.IsSuccessStatusCode -or $ChunkBody -notmatch '"success"\s*:\s*true') {
      throw "HostSPK binary chunk upload failed for ${RemoteFile}: $ChunkBody"
    }
  } finally {
    if ($Multipart) { $Multipart.Dispose() }
    if ($Client) { $Client.Dispose() }
    if ($Handler) { $Handler.Dispose() }
  }

  $AssembleResponse = Post-Form "$Base/a/services/$Service/file-manager-assemble" `
    @{ name = "$Name|::|$script:FileManagerPackageId|::|$UploadSession"; offset_bottom = 1; offset_top = $TotalChunks } $Headers
  Assert-FileManagerSuccess $AssembleResponse "assemble $RemoteFile"
  Write-Output "Assembled binary chunk: $RemoteFile"

  $PublishResponse = Post-Form "$Base/a/services/$Service/file-manager/upload" `
    @{ action = "upload"; tmp = $StagedTmp; size = $Bytes.Length; dest = $RemoteFile } $Headers
  Assert-FileManagerSuccess $PublishResponse "publish $RemoteFile"
  Write-Output "Published binary file: $RemoteFile"
}

function Save-RemoteFile($LocalFile, $RemoteFile, $Headers) {
  try {
    $CreateResponse = Post-Form "$Base/a/services/$Service/file-manager/createfile" @{ action = "createfile"; name = $RemoteFile } $Headers
    Assert-FileManagerSuccess $CreateResponse "createfile $RemoteFile" -AllowExists
  } catch {
    if ($_.Exception.Message -notmatch "exist|already") { throw }
  }

  $Content = [System.IO.File]::ReadAllText($LocalFile, [System.Text.Encoding]::UTF8)
  $SaveResponse = Post-Form "$Base/a/services/$Service/file-manager/savefile" @{ action = "savefile"; file = $RemoteFile; content = $Content } $Headers
  Assert-FileManagerSuccess $SaveResponse "savefile $RemoteFile"
}

$Headers = Get-FileManagerHeaders
Write-Output "Authenticated File Manager package $script:FileManagerPackageId"

if ($OnlyFiles -and $OnlyFiles.Count -eq 1 -and $OnlyFiles[0].Contains(",")) {
  $OnlyFiles = $OnlyFiles[0].Split(",", [System.StringSplitOptions]::RemoveEmptyEntries) |
    ForEach-Object { $_.Trim() }
}

if ($OnlyFiles -and $OnlyFiles.Count) {
  $Files = foreach ($Relative in $OnlyFiles) {
    $FullPath = Join-Path $Dist $Relative
    if (-not (Test-Path $FullPath)) { throw "Requested deploy file not found: $Relative" }
    Get-Item $FullPath
  }
} elseif ($CriticalOnly) {
  $RelativeFiles = @(
    "assets/styles.css",
    "assets/premium.css",
    "assets/cpl-hub.css",
    "assets/reference-home.css",
    "assets/app.js",
    "assets/images/hero/cpl-2026-css-hero-reference.webp",
    "assets/images/hero/cpl-2026-player-artwork.webp",
    "assets/images/players/cpl-2026-players-hero.webp",
    "assets/images/hub/cpl-final-trophy.webp",
    "assets/images/brand/cpl-2026-brand-lockup.webp",
    ".htaccess",
    "index.html",
    "cpl-2026/index.html",
    "fixtures/index.html",
    "players/index.html",
    "teams/index.html",
    "points-table/index.html",
    "live-score/index.html",
    "how-to-watch/index.html",
    "news/index.html",
    "venues/index.html",
    "tickets/index.html",
    "faq/index.html",
    "results/index.html",
    "data-quality.json",
    "sitemap.xml",
    "robots.txt"
  )
  $PlayerDirectory = Join-Path $Dist "assets/images/players/directory"
  if (Test-Path $PlayerDirectory) {
    $RelativeFiles += Get-ChildItem -Path $PlayerDirectory -Filter "*.webp" -File |
      ForEach-Object {
        $_.FullName.Substring($Dist.Length).TrimStart("\") -replace "\\", "/"
      }
  }
  $Files = foreach ($Relative in $RelativeFiles) {
    $FullPath = Join-Path $Dist $Relative
    if (Test-Path $FullPath) { Get-Item $FullPath }
  }
} elseif ($Full) {
  $Files = Get-ChildItem -Path $Dist -Recurse -File |
    Sort-Object FullName
} else {
  $Files = Get-ChildItem -Path $Dist -Recurse -File |
    Where-Object { $_.Name -eq ".htaccess" -or $_.Extension -in ".html", ".css", ".js", ".json", ".xml", ".txt" } |
    Sort-Object FullName
}

$Dirs = $Files |
  ForEach-Object { Split-Path ($_.FullName.Substring($Dist.Length).TrimStart("\") -replace "\\", "/") -Parent } |
  ForEach-Object { $_ -replace "\\", "/" } |
  Where-Object { $_ } |
  Sort-Object -Unique

foreach ($Dir in $Dirs) {
  try {
    $DirectoryResponse = Post-Form "$Base/a/services/$Service/file-manager/createdir" @{ action = "createdir"; name = "/public_html/$Dir" } $Headers
    Assert-FileManagerSuccess $DirectoryResponse "createdir /public_html/$Dir" -AllowExists
  } catch {
    if ($_.Exception.Message -notmatch "exist|already") { throw }
  }
}

$Uploaded = 0
foreach ($File in $Files) {
  $Relative = $File.FullName.Substring($Dist.Length).TrimStart("\") -replace "\\", "/"
  $Remote = "/public_html/$Relative"
  if ($File.Extension -match '^\.(png|jpe?g|webp|gif|ico|avif|bmp|zip)$') {
    Save-RemoteBinaryFile $File.FullName $Remote $Headers
  } else {
    Save-RemoteFile $File.FullName $Remote $Headers
  }

  if ($ExtractArchives -and $File.Extension -eq ".zip") {
    $RemoteArchive = "$RemoteHome/public_html/$Relative"
    $ExtractResponse = Post-Form "$Base/a/services/$Service/file-manager-platform/extract" @{
      action = "extract"
      type = "unzip"
      source = $RemoteArchive
      dest = "$RemoteHome/public_html"
      overwrite = "true"
    } $Headers
    $ExtractJson = $ExtractResponse.Content | ConvertFrom-Json
    if (-not $ExtractJson.result.success) {
      throw "HostSPK archive extraction failed for ${Relative}: $($ExtractResponse.Content)"
    }
    Write-Output "Extracted archive: $Relative"

    $DeleteResponse = Post-Form "$Base/a/services/$Service/file-manager-platform/delete" @{
      action = "delete"
      "files[]" = $RemoteArchive
    } $Headers
    Assert-FileManagerSuccess $DeleteResponse "delete extracted archive $Relative"
    Write-Output "Removed remote archive: $Relative"
  }

  $Uploaded++
  Write-Output "Uploaded $Uploaded/$($Files.Count): $Relative"
}

Write-Output "Done. Uploaded $Uploaded file(s)."
