'use strict';

var fs = require('fs'),
    path = require('path'),
    npm = require('npm'),
    shell = require('shelljs'),
    chalk = require('chalk');


function Progress() {
    var interval, counter;

    function printMsg() {
        switch (counter) {
            case 0:
                console.log('Use `intrepidjs --help` from command line for all CLI options');
                break;
            case 2:
                console.log('This may take a little while depending on your connection speed');
                break;
            case 15:
                console.log('Seems a bit slow. Check your internet connection...');
                break;
            default:
                console.log('Still cloning ...');
                break;
        }
        counter++;
    }

    return {
        start: function() {
            counter = 0;
            interval = setInterval(printMsg, 3000);
        },
        stop: function() {
            clearInterval(interval);
        }
    };
}

var progress = new Progress(),
    source = 'https://github.com/wtelecom/intrepidjs.git';

function loadPackageJson(path, callback) {
    fs.readFile(path, function(err, data) {
        if (err) return callback(err);

        try {
            var pkg = JSON.parse(data.toString());
            callback(null, pkg);
        } catch (err) {
            return callback(err);
        }
    });
}

exports.init = function(name) {
    if (!shell.which('git')) return console.log(chalk.red('Prerequisite not installed: git'));

    console.log(chalk.green('Cloning InretpidJS into destination folder'));

    progress.start();
  
    shell.exec('git clone ' + source + ' ' + name, function(code, output) {
        progress.stop();
        if (code) return console.log(chalk.red('Error: git clone failed:', output));

        loadPackageJson('./' + name + '/package.json', function(err, data) {
            if (err) {
                console.log(chalk.yellow('Something went wrong'));
                console.log(chalk.yellow('If the problem persists see past issues here: https://github.com/wtelecom/intrepidjs/issues'));
                console.log(chalk.yellow('Or open a new issue here https://github.com/wtelecom/intrepidjs/issues/new'));
                process.exit();
            }

            console.log(chalk.green('Version: %s cloned'), data.version);
            console.log();

            shell.cd(name);

            npm.load(function(err, npm) {
                console.log(chalk.green('Installing dependencies...'));
                console.log();
                    npm.commands.install(function(err) {
                        if (err) {
                            console.log(chalk.red('Error: npm install failed'));
                            return console.error(err);
                        }
                        console.log(chalk.green('Installing Bower depenedencies'));
                        shell.cd('public/vendor');
                        require('bower').commands.install()
                            .on('error', function(err) {
                                console.log(chalk.red(err));
                            })
                            .on('end', function (installed) {
                                console.log(installed);
                                shell.cd('../../');
                                console.log(chalk.green('Running the intrepidjs app...'));
                                console.log();
                                shell.exec('node app.js');
                            });
                    });
            });
            console.log();
        });
    });
};