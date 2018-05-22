(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("angular/packages/elements/schematics/ng-add/index", ["require", "exports", "@angular-devkit/schematics", "@angular-devkit/schematics/tasks"], factory);
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
            catch (e) {
                context.logger.log('warn', 'Failed to add the polyfill document-register-element.js to scripts');
            }
            context.logger.log('info', 'Added document-register-element.js polyfill to scripts');
            return host;
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zY2hlbWF0aWNzL25nLWFkZC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILHlEQUFxRjtJQUNyRiwwREFBd0U7SUFHeEUsbUJBQXdCLE9BQWU7UUFDckMsT0FBTyxrQkFBSyxDQUFDO1lBQ1gsT0FBTyxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGlCQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsd0JBQXdCLEVBQUUsRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFDO1NBQzdGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFKRCw0QkFJQztJQUVELG1FQUFtRTtJQUNuRTtRQUNFLE9BQU8sVUFBQyxJQUFVLEVBQUUsT0FBeUI7WUFFM0MsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFO2dCQUMvQixJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDOUQsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFakMsa0VBQWtFO2dCQUNsRSxJQUFNLElBQUksR0FBRyxjQUFjLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztpQkFDakI7Z0JBRUQsOENBQThDO2dCQUM5QyxJQUFNLEdBQUcsR0FBRywyQkFBMkIsQ0FBQztnQkFDeEMsSUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDO2dCQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDO2lCQUMzQjtnQkFFRCxzQ0FBc0M7Z0JBQ3RDLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsb0RBQW9ELENBQUMsQ0FBQztnQkFFakYseUJBQXlCO2dCQUN6QixPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksOEJBQXNCLEVBQUUsQ0FBQyxDQUFDO2FBQy9DO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsNEVBQTRFO0lBQzVFLG1CQUFtQixPQUFlO1FBQ2hDLE9BQU8sVUFBQyxJQUFVLEVBQUUsT0FBeUI7WUFDM0MsSUFBTSxNQUFNLEdBQUcsMkVBQTJFLENBQUM7WUFHM0YsSUFBSTtnQkFDRixxQ0FBcUM7Z0JBQ3JDLElBQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ2xELElBQUksZUFBZSxFQUFFO29CQUNuQixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDM0QsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDO29CQUNwRSxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3RGLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQy9EO2FBQ0Y7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDVixPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FDZCxNQUFNLEVBQUUsb0VBQW9FLENBQUMsQ0FBQzthQUNuRjtZQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSx3REFBd0QsQ0FBQyxDQUFDO1lBRXJGLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQyxDQUFDO0lBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgVHJlZSwgY2hhaW4sIG5vb3B9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7Tm9kZVBhY2thZ2VJbnN0YWxsVGFza30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuaW1wb3J0IHtTY2hlbWF9IGZyb20gJy4vc2NoZW1hJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ob3B0aW9uczogU2NoZW1hKTogUnVsZSB7XG4gIHJldHVybiBjaGFpbihbXG4gICAgb3B0aW9ucyAmJiBvcHRpb25zLnNraXBQYWNrYWdlSnNvbiA/IG5vb3AoKSA6IGFkZFBhY2thZ2VKc29uRGVwZW5kZW5jeSgpLCBhZGRTY3JpcHQob3B0aW9ucylcbiAgXSk7XG59XG5cbi8qKiBBZGRzIGEgcGFja2FnZS5qc29uIGRlcGVuZGVuY3kgZm9yIGRvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQgKi9cbmZ1bmN0aW9uIGFkZFBhY2thZ2VKc29uRGVwZW5kZW5jeSgpIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG5cbiAgICBpZiAoaG9zdC5leGlzdHMoJ3BhY2thZ2UuanNvbicpKSB7XG4gICAgICBjb25zdCBqc29uU3RyID0gaG9zdC5yZWFkKCdwYWNrYWdlLmpzb24nKSAhLnRvU3RyaW5nKCd1dGYtOCcpO1xuICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoanNvblN0cik7XG5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBkZXBlbmRlbmNpZXMsIGNyZWF0ZSBhbiBlbnRyeSBmb3IgZGVwZW5kZW5jaWVzLlxuICAgICAgY29uc3QgdHlwZSA9ICdkZXBlbmRlbmNpZXMnO1xuICAgICAgaWYgKCFqc29uW3R5cGVdKSB7XG4gICAgICAgIGpzb25bdHlwZV0gPSB7fTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm90IGFscmVhZHkgcHJlc2VudCwgYWRkIHRoZSBkZXBlbmRlbmN5LlxuICAgICAgY29uc3QgcGtnID0gJ2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQnO1xuICAgICAgY29uc3QgdmVyc2lvbiA9ICdeMS43LjInO1xuICAgICAgaWYgKCFqc29uW3R5cGVdW3BrZ10pIHtcbiAgICAgICAganNvblt0eXBlXVtwa2ddID0gdmVyc2lvbjtcbiAgICAgIH1cblxuICAgICAgLy8gV3JpdGUgdGhlIEpTT04gYmFjayB0byBwYWNrYWdlLmpzb25cbiAgICAgIGhvc3Qub3ZlcndyaXRlKCdwYWNrYWdlLmpzb24nLCBKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAyKSk7XG4gICAgICBjb250ZXh0LmxvZ2dlci5sb2coJ2luZm8nLCAnQWRkZWQgYGRvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnRgIGFzIGEgZGVwZW5kZW5jeS4nKTtcblxuICAgICAgLy8gSW5zdGFsbCB0aGUgZGVwZW5kZW5jeVxuICAgICAgY29udGV4dC5hZGRUYXNrKG5ldyBOb2RlUGFja2FnZUluc3RhbGxUYXNrKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBob3N0O1xuICB9O1xufVxuXG4vKiogQWRkcyB0aGUgZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudC5qcyBzY3JpcHQgdG8gdGhlIGFuZ3VsYXIgQ0xJIGpzb24uICovXG5mdW5jdGlvbiBhZGRTY3JpcHQob3B0aW9uczogU2NoZW1hKSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHNjcmlwdCA9ICdub2RlX21vZHVsZXMvZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudC9idWlsZC9kb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50LmpzJztcblxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEhhbmRsZSB0aGUgbmV3IGpzb24gLSBhbmd1bGFyLmpzb25cbiAgICAgIGNvbnN0IGFuZ3VsYXJKc29uRmlsZSA9IGhvc3QucmVhZCgnYW5ndWxhci5qc29uJyk7XG4gICAgICBpZiAoYW5ndWxhckpzb25GaWxlKSB7XG4gICAgICAgIGNvbnN0IGpzb24gPSBKU09OLnBhcnNlKGFuZ3VsYXJKc29uRmlsZS50b1N0cmluZygndXRmLTgnKSk7XG4gICAgICAgIGNvbnN0IHByb2plY3QgPSBPYmplY3Qua2V5cyhqc29uWydwcm9qZWN0cyddKVswXSB8fCBvcHRpb25zLnByb2plY3Q7XG4gICAgICAgIGNvbnN0IHNjcmlwdHMgPSBqc29uWydwcm9qZWN0cyddW3Byb2plY3RdWydhcmNoaXRlY3QnXVsnYnVpbGQnXVsnb3B0aW9ucyddWydzY3JpcHRzJ107XG4gICAgICAgIHNjcmlwdHMucHVzaCh7aW5wdXQ6IHNjcmlwdH0pO1xuICAgICAgICBob3N0Lm92ZXJ3cml0ZSgnYW5ndWxhci5qc29uJywgSlNPTi5zdHJpbmdpZnkoanNvbiwgbnVsbCwgMikpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnRleHQubG9nZ2VyLmxvZyhcbiAgICAgICAgICAnd2FybicsICdGYWlsZWQgdG8gYWRkIHRoZSBwb2x5ZmlsbCBkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50LmpzIHRvIHNjcmlwdHMnKTtcbiAgICB9XG5cbiAgICBjb250ZXh0LmxvZ2dlci5sb2coJ2luZm8nLCAnQWRkZWQgZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudC5qcyBwb2x5ZmlsbCB0byBzY3JpcHRzJyk7XG5cbiAgICByZXR1cm4gaG9zdDtcbiAgfTtcbn1cbiJdfQ==