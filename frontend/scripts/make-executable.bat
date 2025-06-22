@echo off
echo Making deploy-to-vercel.js executable...
echo @node "%%~dp0deploy-to-vercel.js" %%* > "%~dp0deploy-to-vercel.cmd"
echo Done! You can now run deploy-to-vercel.cmd 