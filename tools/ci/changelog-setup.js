const versions = require('../../versions.json');

module.exports = function (Handlebars) {
  Handlebars.registerHelper('download', () => {
    return `[frontend-setup-${ versions.frontend }.exe](https://github.com/xXKeyleXx/DevConsole/releases/download/frontend-${ versions.frontend }/frontend-setup-${ versions.frontend }.exe)`;
  });
};
