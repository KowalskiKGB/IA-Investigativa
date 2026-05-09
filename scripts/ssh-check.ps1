Import-Module Posh-SSH
$plain = if ($env:SERVER_PWD) { $env:SERVER_PWD } else { Read-Host -AsSecureString 'senha SSH' | ConvertFrom-SecureString -AsPlainText }
$pwd = ConvertTo-SecureString $plain -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential("rafael", $pwd)
$session = New-SSHSession -ComputerName "100.95.227.38" -Credential $cred -AcceptKey -Force
$cmds = @(
  "echo 123 | sudo -S ls /etc/cloudflared/ 2>&1",
  "echo 123 | sudo -S cat /etc/cloudflared/config.yml 2>&1",
  "echo 123 | sudo -S cloudflared tunnel list 2>&1",
  "ls ~/.cloudflared/ 2>&1 || echo NO_USER_CF",
  "echo 123 | sudo -S systemctl status cloudflared --no-pager 2>&1 | head -20"
)
foreach ($c in $cmds) {
  Write-Host "----- $c -----"
  (Invoke-SSHCommand -SSHSession $session -Command $c -TimeOut 30).Output -join "`n" | Write-Host
}
Remove-SSHSession -SSHSession $session | Out-Null
