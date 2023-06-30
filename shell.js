const readline = require('readline-sync')
const fs = require('fs')
const path = require('path')
const https = require('https')
const os = require('os')
const { exec } = require('child_process');
//const { app, BrowserWindow } = require('electron')
//const nativeImage = require('electron').nativeImage
const __VERSION ="1.0.0"
const download = require('download')
var helperFunctions = {
    parseArguments: (flags) => {
        var args = {}
        process.argv.forEach(function (val) {
            let pos = process.argv.indexOf(val)
            if (!(flags.indexOf(val.replaceAll('-', '')) == -1)) {
                args[flags[flags.indexOf(val.replaceAll('-', ''))]] = process.argv[pos + 1]
            }

        })
        return args
    },
    processArgs: () => {
        var args = helperFunctions.parseArguments(['install', 'n', 'name', 'run', 'u', 'url', 'help', 'h', 'remove', 'r', 'i','appDir','y'])
        //console.log(args)
        if (args.name == undefined) {
            args.name = args.n
            //delete args.n
        }
        delete args.n
        if (args.url == undefined) {
            args.url = args.u
            //delete args.u
        }
        delete args.u
        if (args.help == undefined) {
            args.help = args.h
            //delete args.u
        }
        delete args.h
        if (args.install == undefined) {
            args.install = args.i
            //delete args.u
        }
        delete args.i
        if (args.remove == undefined) {
            args.remove = args.r
            //delete args.u
        }
        delete args.r
        //console.log(args)
        Object.keys(args).forEach(function (value, index) {
            if (Object.values(args)[index] == undefined) {
                delete args[value]
            }
        })
        return args
    },

    downloadFavicon: async (url, name,cwd) => {
        try {
            
            await download(`https://www.google.com/s2/favicons?domain_url=${url}&sz=128`, path.join(cwd, '/images/'))
            fs.renameSync(path.join(cwd, '/images/', 'favicons.png'), path.join(cwd, '/images/', name + '.png'))


            console.log('\x1b[32m')
            console.log('Icon Download Completed')
        } catch (error) {
            console.error('\x1b[31m', 'Error Downloading App Icon, Reverting to default image')
            await download(`https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8SHtzDF-mwA9HjxJOkxQWfpBTCi5ardngkA&usqp=CAU`, path.join(cwd, '/images/'))
            fs.renameSync(path.join(cwd, '/images/', 'favicons.png'), path.join(cwd, '/images/', name + '.png'))

            //console.log(error)
        }
    },
    createDesktopFile: (name, exec, image, url, profilePath) => {
        var file = `
[Desktop Entry]
Encoding=UTF-8
Version=1.0
Name=${name.replaceAll('_','')}
GenericName=${name.replaceAll('_','')}
Exec=${exec}
Terminal=false
Icon=${image}
Type=Application
Categories=GTK;WebApps;
Comment=Native Application for ${name}
X-MultipleArgs=false
MimeType=text/html;text/xml;application/xhtml_xml;
StartupWMClass=org.gnome.Epiphany.WebApp-${name.replaceAll(' ','_')}
StartupNotify=true
X-WebApp-Browser=Epiphany
X-WebApp-URL=${url}
X-WebApp-CustomParameters=
X-WebApp-Navbar=false
X-WebApp-PrivateWindow=false
X-WebApp-Isolated=true
    `
        fs.writeFileSync(`/usr/share/applications/${name.replaceAll(' ','_')}.desktop`, file)
        fs.writeFileSync(`${profilePath}/org.gnome.Epiphany.WebApp-${name.replaceAll(' ','_')}.desktop`, file)
    },
}
var argsFunctions = {
    install: async (args,cwd) => {
        if (!(os.userInfo().uid === 0)) {
            console.error('\x1b[31m', 'Error: This Program Must be Run as Root')
            process.exit(1)
        }
        if (args.name == undefined) {
            args.name = readline.question('What do you want to name this application:\n')
        }
        /*if(args.name.includes('_')){
            console.error('\x1b[31m', 'The name of your program must not contain underscores')
            process.exit(1)
        }*/
        var name = args.name
        var url = args.install
        if ((args.hasOwnProperty('y')&&args.y=="true")||readline.keyInYN(`Are you sure you want to install ${name}?`)) {
            let database = JSON.parse(fs.readFileSync(path.join(cwd, 'apps.json')))
            let image = path.join(cwd, '/images/', name + '.png')
            database[name.replaceAll(' ','_')] = { url, image }

            fs.writeFileSync(path.join(cwd, 'apps.json'), JSON.stringify(database))
            
            if (!fs.existsSync(`/system/webapps/profiles/org.gnome.Epiphany.WebApp-${name.replaceAll(' ','_')}`)){
                fs.mkdirSync(`/system/webapps/profiles/org.gnome.Epiphany.WebApp-${name.replaceAll(' ','_')}`);
            }
            helperFunctions.createDesktopFile(name.replaceAll('_',' '), `webapps run ${name.replaceAll(' ','_')}`, image, url, `/system/webapps/profiles/org.gnome.Epiphany.WebApp-${name.replaceAll(' ','_')}`)
           
            fs.writeFileSync(`/system/webapps/profiles/org.gnome.Epiphany.WebApp-${name.replaceAll(' ','_')}/.app`,'')
            await helperFunctions.downloadFavicon(url, name,cwd).then(function () {
                fs.copyFileSync(image,`/system/webapps/profiles/org.gnome.Epiphany.WebApp-${name.replaceAll(' ','_')}/app-icon.png`)
                exec(`chmod 777 -R /system/webapps/profiles/org.gnome.Epiphany.WebApp-${name.replaceAll(' ','_')}`)
                console.log(`Installation Complete! To start your app run "webapps run ${name.replaceAll(' ','_')}" in your terminal`)
                process.exit()
            })
            //process.exit()
        } else { return }
    },
    run: (args,cwd) => {
        //Run an app
        var database = JSON.parse(fs.readFileSync(path.join(cwd, 'apps.json')))
        var exec_string = `sh -c 'XAPP_FORCE_GTKWINDOW_ICON="${database[args.run].image}"; epiphany --application-mode --profile="/system/webapps/profiles/org.gnome.Epiphany.WebApp-${args.run.replaceAll(' ','_')}" "${database[args.run].url}"'`
        //console.log(exec_string)
        exec(exec_string)
    },
    help: () => {
        if (process.argv[0] == 'sudo') {
            var name = `sudo ${process.argv[1]}`
        } else if (process.argv[0].includes('node')) {
            var name = `node ${process.argv[1]}`
        } else { var name = process.argv[0] }
        console.log(`
        Web Apps

        Usage: ${name} <Action> <Options>
        Actions:
            install - Install a site as a native application(Must be run as sudo or root.)
            run - Run a site that was installed as a native app 
            remove - remove a site's application
            help - Print this manual 
        Options:
            install - url*, name, yes/y
            run - name*
            remove - name*
        Examples:
        ${name} run foo
        ${name} install https://www.google.com --name google
        ${name} install https://www.google.com --name google -y true
        ${name} install https://www.google.com 
        ${name} remove google
        ${name} help    
        * states that that option is manditory     
        If you have an app that has spaces in its name, to run it you must replace those with underscores.
        webapps@${__VERSION} ${__dirname}      
        `)
        process.exit()
    },
    remove: (args,cwd) => {
        function toUppercase(str) {
            const arr = str.split(" ");

            //loop through each element of the array and capitalize the first letter.


            for (var i = 0; i < arr.length; i++) {
                arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
            }
            return arr.join('')
        }
        var database = JSON.parse(fs.readFileSync(path.join(cwd, 'apps.json')))
        if (!(database[args.remove] == undefined)) {
            if (readline.keyInYN(`Are you sure you want to remove ${args.remove}?`)) {
                try {
                    if (!(os.userInfo().uid === 0)) {
                        console.error('\x1b[31m', 'Error: This Program Must be Run as Root')
                        process.exit(1)
                    } 
                    
                fs.unlinkSync(database[args.remove].image)
                fs.rmSync(`${cwd}/profiles/org.gnome.Epiphany.WebApp-${args.remove}/`,{ recursive: true })
                fs.unlinkSync(`/usr/share/applications/${args.remove}.desktop`)
                delete database[args.remove]
                fs.writeFileSync(path.join(cwd, 'apps.json'), JSON.stringify(database))
                console.log('\x1b[32m',`${toUppercase(args.remove)} has been deleted`)
                process.exit()
                } catch (error) {
                    console.log('\x1b[31m', `Error: Couldn't completly remove ${toUppercase(args.remove)}. This is proably due to a failed installation or a invalid parameter.`)
                    //console.log(error)
                }
                
            } else { return }
        } else { console.log('\x1b[31m', `Error: ${toUppercase(args.remove)} doesn't exist.`) }
    }
};
(async () => {
    var args = helperFunctions.processArgs()
    //console.log(args)
    if (Object.values(args).every(el => el === undefined)) {
        argsFunctions.help()
        //console.log('test')
    }
    var cwd;
    if (!(args.appDir == undefined)) {
        cwd = args.appDir
    }else{
        cwd = '/system/webapps/'
    }
    Object.keys(args).forEach(async (key) => {
        try {
            if (key.includes('help')) {
                await argsFunctions.help(args,cwd)

            } else if (key.includes('install')) {
                await argsFunctions.install(args,cwd)
            } else if (key.includes('run')) {
                await argsFunctions.run(args,cwd)
            } else if (key.includes('remove')) {
                await argsFunctions.remove(args,cwd)
            }


        } catch (err) {
            console.log('\x1b[31m','Error: Invalid Argument')
            //console.error(err)
            //argsFunctions.help()
            process.exit(1)
        }
    })
})()
