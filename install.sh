#!/bin/bash
echo 'Starting Installation'
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
nvm install node
nvm use node

npm install
echo 'Installing The Packging Module'
npm install -g pkg
echo 'Creating Directories. Ignore Errors from mkdir.'
echo 'mkdir /system /system/webapps; echo `{}`> /system/webapps/apps.json;mkdir /system/webapps/profiles; chmod -R 777 /system/webapps/profiles'| sudo bash
echo 'Builing Package'
mkdir ./builds
pkg ./shell.js
echo 'Moving Distrubutibles'
mv ./shell-linux ./builds/
mv ./shell-win.exe ./builds/
mv ./shell-macos ./builds/   
npm remove -g pkg
nvm uninstall node
rm -rf "$NVM_DIR"
echo 'Installation Complete. The executables are in the builds folder'
if [ $(uname) == 'Linux' ]; then
    echo 'mv ./builds/shell-linux ./builds/webapps && mv ./builds/webapps /bin/'| sudo bash
fi
