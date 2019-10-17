(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/elements/schematics/ng-add", ["require", "exports", "@angular-devkit/schematics", "@angular-devkit/schematics/tasks"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var schematics_1 = require("@angular-devkit/schematics");
    var tasks_1 = require("@angular-devkit/schematics/tasks");
    function default_1(options) {
        return schematics_1.chain([
            options && options.skipPackageJson ? schematics_1.noop() : addPackageJsonDependency(), addScript(options)
        ]);
    }
    exports.default = default_1;
    /** Adds a package.json dependency for document-register-element */
    function addPackageJsonDependency() {
        return function (host, context) {
            if (host.exists('package.json')) {
                var jsonStr = host.read('package.json').toString('utf-8');
                var json = JSON.parse(jsonStr);
                // If there are no dependencies, create an entry for dependencies.
                var type = 'dependencies';
                if (!json[type]) {
                    json[type] = {};
                }
                // If not already present, add the dependency.
                var pkg = 'document-register-element';
                var version = '^1.7.2';
                if (!json[type][pkg]) {
                    json[type][pkg] = version;
                }
                // Write the JSON back to package.json
                host.overwrite('package.json', JSON.stringify(json, null, 2));
                context.logger.log('info', 'Added `document-register-element` as a dependency.');
                // Install the dependency
                context.addTask(new tasks_1.NodePackageInstallTask());
            }
            return host;
        };
    }
    /** Adds the document-register-element.js script to the angular CLI json. */
    function addScript(options) {
        return function (host, context) {
            var script = 'node_modules/document-register-element/build/document-register-element.js';
            try {
                // Handle the new json - angular.json
                var angularJsonFile = host.read('angular.json');
                if (angularJsonFile) {
                    var json = JSON.parse(angularJsonFile.toString('utf-8'));
                    var project = Object.keys(json['projects'])[0] || options.project;
                    var scripts = json['projects'][project]['architect']['build']['options']['scripts'];
                    scripts.push({ input: script });
                    host.overwrite('angular.json', JSON.stringify(json, null, 2));
                }
            }
            catch (_a) {
                context.logger.log('warn', 'Failed to add the polyfill document-register-element.js to scripts');
            }
            context.logger.log('info', 'Added document-register-element.js polyfill to scripts');
            return host;
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zY2hlbWF0aWNzL25nLWFkZC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILHlEQUFxRjtJQUNyRiwwREFBd0U7SUFHeEUsbUJBQXdCLE9BQWU7UUFDckMsT0FBTyxrQkFBSyxDQUFDO1lBQ1gsT0FBTyxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGlCQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsd0JBQXdCLEVBQUUsRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFDO1NBQzdGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFKRCw0QkFJQztJQUVELG1FQUFtRTtJQUNuRSxTQUFTLHdCQUF3QjtRQUMvQixPQUFPLFVBQUMsSUFBVSxFQUFFLE9BQXlCO1lBRTNDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRTtnQkFDL0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzlELElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRWpDLGtFQUFrRTtnQkFDbEUsSUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDO2dCQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7aUJBQ2pCO2dCQUVELDhDQUE4QztnQkFDOUMsSUFBTSxHQUFHLEdBQUcsMkJBQTJCLENBQUM7Z0JBQ3hDLElBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQztnQkFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQztpQkFDM0I7Z0JBRUQsc0NBQXNDO2dCQUN0QyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLG9EQUFvRCxDQUFDLENBQUM7Z0JBRWpGLHlCQUF5QjtnQkFDekIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLDhCQUFzQixFQUFFLENBQUMsQ0FBQzthQUMvQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELDRFQUE0RTtJQUM1RSxTQUFTLFNBQVMsQ0FBQyxPQUFlO1FBQ2hDLE9BQU8sVUFBQyxJQUFVLEVBQUUsT0FBeUI7WUFDM0MsSUFBTSxNQUFNLEdBQUcsMkVBQTJFLENBQUM7WUFHM0YsSUFBSTtnQkFDRixxQ0FBcUM7Z0JBQ3JDLElBQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ2xELElBQUksZUFBZSxFQUFFO29CQUNuQixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDM0QsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDO29CQUNwRSxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3RGLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQy9EO2FBQ0Y7WUFBQyxXQUFNO2dCQUNOLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUNkLE1BQU0sRUFBRSxvRUFBb0UsQ0FBQyxDQUFDO2FBQ25GO1lBRUQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLHdEQUF3RCxDQUFDLENBQUM7WUFFckYsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDLENBQUM7SUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBUcmVlLCBjaGFpbiwgbm9vcH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtOb2RlUGFja2FnZUluc3RhbGxUYXNrfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90YXNrcyc7XG5pbXBvcnQge1NjaGVtYX0gZnJvbSAnLi9zY2hlbWEnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihvcHRpb25zOiBTY2hlbWEpOiBSdWxlIHtcbiAgcmV0dXJuIGNoYWluKFtcbiAgICBvcHRpb25zICYmIG9wdGlvbnMuc2tpcFBhY2thZ2VKc29uID8gbm9vcCgpIDogYWRkUGFja2FnZUpzb25EZXBlbmRlbmN5KCksIGFkZFNjcmlwdChvcHRpb25zKVxuICBdKTtcbn1cblxuLyoqIEFkZHMgYSBwYWNrYWdlLmpzb24gZGVwZW5kZW5jeSBmb3IgZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudCAqL1xuZnVuY3Rpb24gYWRkUGFja2FnZUpzb25EZXBlbmRlbmN5KCkge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcblxuICAgIGlmIChob3N0LmV4aXN0cygncGFja2FnZS5qc29uJykpIHtcbiAgICAgIGNvbnN0IGpzb25TdHIgPSBob3N0LnJlYWQoJ3BhY2thZ2UuanNvbicpICEudG9TdHJpbmcoJ3V0Zi04Jyk7XG4gICAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZShqc29uU3RyKTtcblxuICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIGRlcGVuZGVuY2llcywgY3JlYXRlIGFuIGVudHJ5IGZvciBkZXBlbmRlbmNpZXMuXG4gICAgICBjb25zdCB0eXBlID0gJ2RlcGVuZGVuY2llcyc7XG4gICAgICBpZiAoIWpzb25bdHlwZV0pIHtcbiAgICAgICAganNvblt0eXBlXSA9IHt9O1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBub3QgYWxyZWFkeSBwcmVzZW50LCBhZGQgdGhlIGRlcGVuZGVuY3kuXG4gICAgICBjb25zdCBwa2cgPSAnZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudCc7XG4gICAgICBjb25zdCB2ZXJzaW9uID0gJ14xLjcuMic7XG4gICAgICBpZiAoIWpzb25bdHlwZV1bcGtnXSkge1xuICAgICAgICBqc29uW3R5cGVdW3BrZ10gPSB2ZXJzaW9uO1xuICAgICAgfVxuXG4gICAgICAvLyBXcml0ZSB0aGUgSlNPTiBiYWNrIHRvIHBhY2thZ2UuanNvblxuICAgICAgaG9zdC5vdmVyd3JpdGUoJ3BhY2thZ2UuanNvbicsIEpTT04uc3RyaW5naWZ5KGpzb24sIG51bGwsIDIpKTtcbiAgICAgIGNvbnRleHQubG9nZ2VyLmxvZygnaW5mbycsICdBZGRlZCBgZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudGAgYXMgYSBkZXBlbmRlbmN5LicpO1xuXG4gICAgICAvLyBJbnN0YWxsIHRoZSBkZXBlbmRlbmN5XG4gICAgICBjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbi8qKiBBZGRzIHRoZSBkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50LmpzIHNjcmlwdCB0byB0aGUgYW5ndWxhciBDTEkganNvbi4gKi9cbmZ1bmN0aW9uIGFkZFNjcmlwdChvcHRpb25zOiBTY2hlbWEpIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qgc2NyaXB0ID0gJ25vZGVfbW9kdWxlcy9kb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50L2J1aWxkL2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQuanMnO1xuXG5cbiAgICB0cnkge1xuICAgICAgLy8gSGFuZGxlIHRoZSBuZXcganNvbiAtIGFuZ3VsYXIuanNvblxuICAgICAgY29uc3QgYW5ndWxhckpzb25GaWxlID0gaG9zdC5yZWFkKCdhbmd1bGFyLmpzb24nKTtcbiAgICAgIGlmIChhbmd1bGFySnNvbkZpbGUpIHtcbiAgICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoYW5ndWxhckpzb25GaWxlLnRvU3RyaW5nKCd1dGYtOCcpKTtcbiAgICAgICAgY29uc3QgcHJvamVjdCA9IE9iamVjdC5rZXlzKGpzb25bJ3Byb2plY3RzJ10pWzBdIHx8IG9wdGlvbnMucHJvamVjdDtcbiAgICAgICAgY29uc3Qgc2NyaXB0cyA9IGpzb25bJ3Byb2plY3RzJ11bcHJvamVjdF1bJ2FyY2hpdGVjdCddWydidWlsZCddWydvcHRpb25zJ11bJ3NjcmlwdHMnXTtcbiAgICAgICAgc2NyaXB0cy5wdXNoKHtpbnB1dDogc2NyaXB0fSk7XG4gICAgICAgIGhvc3Qub3ZlcndyaXRlKCdhbmd1bGFyLmpzb24nLCBKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAyKSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBjb250ZXh0LmxvZ2dlci5sb2coXG4gICAgICAgICAgJ3dhcm4nLCAnRmFpbGVkIHRvIGFkZCB0aGUgcG9seWZpbGwgZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudC5qcyB0byBzY3JpcHRzJyk7XG4gICAgfVxuXG4gICAgY29udGV4dC5sb2dnZXIubG9nKCdpbmZvJywgJ0FkZGVkIGRvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQuanMgcG9seWZpbGwgdG8gc2NyaXB0cycpO1xuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG4iXX0=