#!/bin/bash
echo 'Starting Installation'
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
echo 'Installation Complete. The executables are in the builds folder'
if [ $(uname) == 'Linux' ]; then
    echo 'mv ./builds/shell-linux ./builds/webapps && mv ./builds/webapps /bin/'| sudo bash
fi