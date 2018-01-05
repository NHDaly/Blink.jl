const {app, BrowserWindow} = require('electron')
var net = require("net");
var Menu = require("menu");

// console.log('Args:');
// console.log(process.argv);

function arg(name) {
  for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i] == name) {
      return process.argv[i+1];
    }
  }
}

var handlers = {};

handlers.eval = function(data, c) {
  var result = eval(data.code);
  if (data.callback) {
    result == undefined && (result = null);
    result = {
      type: 'callback',
      data: {
        callback: data.callback,
        result: result
      }
    }
    c.write(JSON.stringify(result));
  }
}

var server = net.createServer(function(c) { //'connection' listener
  c.on('end', function() {
    app.quit();
  });

  var buffer = [''];
  c.on('data', function(data) {
    str = data.toString();
    lines = str.split('\n');
    buffer[0] += lines[0];
    for (var i = 1; i < lines.length; i++)
      buffer[buffer.length] = lines[i];

    while (buffer.length > 1)
      line(buffer.shift());
  });

  function line(s) {
    data = JSON.parse(s);
    if (handlers.hasOwnProperty(data.type)) {
      handlers[data.type](data, c);
    } else {
      throw "No such command: " + data.type;
    }
  }
});

var port = parseInt(arg('port'));
server.listen(port);

app.on("ready", function() {
  app.on('window-all-closed', function(e) {
  });
});

// Window creation
var windows = {};

function createWindow(opts) {
  var win = new BrowserWindow(opts);
  windows[win.id] = win;
  if (opts.url) {
    win.loadURL(opts.url);
  }
  win.setMenu(null);

  // Create a local variable that we'll use in
  // the closed event handler because the property
  // .id won't be accessible anymore when the window
  // has been closed.
  var win_id = win.id

  win.on('closed', function() {
    delete windows[win_id];
  });

  console.log("requiring Menu");

  return win.id;
}

function evalwith(obj, code) {
  return (function() {
    return eval(code);
  }).call(obj);
}

function withwin(id, code) {
  if (windows[id]) {
    return evalwith(windows[id], code);
  }
}

// -----------------------------------
// -- Trying to set up a Menu per Issue #101.
// -----------------------------------
// THIS FAILS with `Error: Cannot find module 'menu'`
//console.log("requiring Menu");
//var Menu = require("menu");
//console.log("Menu: ", Menu);
//
//var template = [{
//    label: "Application",
//    submenu: [
//        { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
//        { type: "separator" },
//        { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
//    ]}, {
//    label: "Edit",
//    submenu: [
//        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
//        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
//        { type: "separator" },
//        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
//        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
//        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
//        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
//    ]}
//];
//
//Menu.setApplicationMenu(Menu.buildFromTemplate(template));
//console.log("Finished setting Application Menu");
