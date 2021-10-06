(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/elements/schematics/ng-add", ["require", "exports", "tslib", "@angular-devkit/schematics", "@angular-devkit/schematics/tasks", "@schematics/angular/utility/dependencies", "@schematics/angular/utility/workspace"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var schematics_1 = require("@angular-devkit/schematics");
    var tasks_1 = require("@angular-devkit/schematics/tasks");
    var dependencies_1 = require("@schematics/angular/utility/dependencies");
    var workspace_1 = require("@schematics/angular/utility/workspace");
    function default_1(options) {
        return (0, schematics_1.chain)([
            options && options.skipPackageJson ? (0, schematics_1.noop)() : addPolyfillDependency(),
            addPolyfill(options),
        ]);
    }
    exports.default = default_1;
    /** Adds a package.json dependency for document-register-element */
    function addPolyfillDependency() {
        return function (host, context) {
            (0, dependencies_1.addPackageJsonDependency)(host, {
                type: dependencies_1.NodeDependencyType.Default,
                name: 'document-register-element',
                version: '^1.7.2',
            });
            context.logger.info('Added "document-register-element" as a dependency.');
            // Install the dependency
            context.addTask(new tasks_1.NodePackageInstallTask());
        };
    }
    /** Adds the document-register-element.js to the polyfills file. */
    function addPolyfill(options) {
        var _this = this;
        return function (host, context) { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
            var projectName, workspace, project, buildTarget, polyfills, content, recorder;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        projectName = options.project;
                        if (!projectName) {
                            throw new schematics_1.SchematicsException('Option "project" is required.');
                        }
                        return [4 /*yield*/, (0, workspace_1.getWorkspace)(host)];
                    case 1:
                        workspace = _a.sent();
                        project = workspace.projects.get(projectName);
                        if (!project) {
                            throw new schematics_1.SchematicsException("Project " + projectName + " is not defined in this workspace.");
                        }
                        if (project.extensions['projectType'] !== 'application') {
                            throw new schematics_1.SchematicsException("@angular/elements requires a project type of \"application\" but " + projectName + " isn't.");
                        }
                        buildTarget = project.targets.get('build');
                        if (!buildTarget || !buildTarget.options) {
                            throw new schematics_1.SchematicsException("Cannot find 'options' for " + projectName + " build target.");
                        }
                        polyfills = buildTarget.options.polyfills;
                        if (typeof polyfills !== 'string') {
                            throw new schematics_1.SchematicsException("polyfills for " + projectName + " build target is not a string.");
                        }
                        content = host.read(polyfills).toString();
                        if (!content.includes('document-register-element')) {
                            recorder = host.beginUpdate(polyfills);
                            recorder.insertRight(content.length, "import 'document-register-element';\n");
                            host.commitUpdate(recorder);
                        }
                        context.logger.info('Added "document-register-element" to polyfills.');
                        return [2 /*return*/];
                }
            });
        }); };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zY2hlbWF0aWNzL25nLWFkZC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCx5REFBMEc7SUFDMUcsMERBQXdFO0lBQ3hFLHlFQUFzRztJQUN0RyxtRUFBbUU7SUFJbkUsbUJBQXdCLE9BQWU7UUFDckMsT0FBTyxJQUFBLGtCQUFLLEVBQUM7WUFDWCxPQUFPLElBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBQSxpQkFBSSxHQUFFLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixFQUFFO1lBQ3JFLFdBQVcsQ0FBQyxPQUFPLENBQUM7U0FDckIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUxELDRCQUtDO0lBRUQsbUVBQW1FO0lBQ25FLFNBQVMscUJBQXFCO1FBQzVCLE9BQU8sVUFBQyxJQUFVLEVBQUUsT0FBeUI7WUFDM0MsSUFBQSx1Q0FBd0IsRUFBQyxJQUFJLEVBQUU7Z0JBQzdCLElBQUksRUFBRSxpQ0FBa0IsQ0FBQyxPQUFPO2dCQUNoQyxJQUFJLEVBQUUsMkJBQTJCO2dCQUNqQyxPQUFPLEVBQUUsUUFBUTthQUNsQixDQUFDLENBQUM7WUFDSCxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO1lBRTFFLHlCQUF5QjtZQUN6QixPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksOEJBQXNCLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxtRUFBbUU7SUFDbkUsU0FBUyxXQUFXLENBQUMsT0FBZTtRQUFwQyxpQkF3Q0M7UUF2Q0MsT0FBTyxVQUFPLElBQVUsRUFBRSxPQUF5Qjs7Ozs7d0JBQzNDLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO3dCQUVwQyxJQUFJLENBQUMsV0FBVyxFQUFFOzRCQUNoQixNQUFNLElBQUksZ0NBQW1CLENBQUMsK0JBQStCLENBQUMsQ0FBQzt5QkFDaEU7d0JBRWlCLHFCQUFNLElBQUEsd0JBQVksRUFBQyxJQUFJLENBQUMsRUFBQTs7d0JBQXBDLFNBQVMsR0FBRyxTQUF3Qjt3QkFDcEMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO3dCQUVwRCxJQUFJLENBQUMsT0FBTyxFQUFFOzRCQUNaLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyxhQUFXLFdBQVcsdUNBQW9DLENBQUMsQ0FBQzt5QkFDM0Y7d0JBRUQsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxLQUFLLGFBQWEsRUFBRTs0QkFDdkQsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixzRUFBa0UsV0FBVyxZQUFTLENBQUMsQ0FBQzt5QkFDN0Y7d0JBRUssV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUNqRCxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRTs0QkFDeEMsTUFBTSxJQUFJLGdDQUFtQixDQUFDLCtCQUE2QixXQUFXLG1CQUFnQixDQUFDLENBQUM7eUJBQ3pGO3dCQUVNLFNBQVMsR0FBSSxXQUFXLENBQUMsT0FBTyxVQUF2QixDQUF3Qjt3QkFDeEMsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLEVBQUU7NEJBQ2pDLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyxtQkFBaUIsV0FBVyxtQ0FBZ0MsQ0FBQyxDQUFDO3lCQUM3Rjt3QkFFSyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDaEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsMkJBQTJCLENBQUMsRUFBRTs0QkFFNUMsUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7NEJBQzdDLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDOzRCQUM5RSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3lCQUM3Qjt3QkFFRCxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpREFBaUQsQ0FBQyxDQUFDOzs7O2FBQ3hFLENBQUM7SUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2NoYWluLCBub29wLCBSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge05vZGVQYWNrYWdlSW5zdGFsbFRhc2t9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rhc2tzJztcbmltcG9ydCB7YWRkUGFja2FnZUpzb25EZXBlbmRlbmN5LCBOb2RlRGVwZW5kZW5jeVR5cGV9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9kZXBlbmRlbmNpZXMnO1xuaW1wb3J0IHtnZXRXb3Jrc3BhY2V9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS93b3Jrc3BhY2UnO1xuXG5pbXBvcnQge1NjaGVtYX0gZnJvbSAnLi9zY2hlbWEnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihvcHRpb25zOiBTY2hlbWEpOiBSdWxlIHtcbiAgcmV0dXJuIGNoYWluKFtcbiAgICBvcHRpb25zICYmIG9wdGlvbnMuc2tpcFBhY2thZ2VKc29uID8gbm9vcCgpIDogYWRkUG9seWZpbGxEZXBlbmRlbmN5KCksXG4gICAgYWRkUG9seWZpbGwob3B0aW9ucyksXG4gIF0pO1xufVxuXG4vKiogQWRkcyBhIHBhY2thZ2UuanNvbiBkZXBlbmRlbmN5IGZvciBkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50ICovXG5mdW5jdGlvbiBhZGRQb2x5ZmlsbERlcGVuZGVuY3koKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGFkZFBhY2thZ2VKc29uRGVwZW5kZW5jeShob3N0LCB7XG4gICAgICB0eXBlOiBOb2RlRGVwZW5kZW5jeVR5cGUuRGVmYXVsdCxcbiAgICAgIG5hbWU6ICdkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50JyxcbiAgICAgIHZlcnNpb246ICdeMS43LjInLFxuICAgIH0pO1xuICAgIGNvbnRleHQubG9nZ2VyLmluZm8oJ0FkZGVkIFwiZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudFwiIGFzIGEgZGVwZW5kZW5jeS4nKTtcblxuICAgIC8vIEluc3RhbGwgdGhlIGRlcGVuZGVuY3lcbiAgICBjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soKSk7XG4gIH07XG59XG5cbi8qKiBBZGRzIHRoZSBkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50LmpzIHRvIHRoZSBwb2x5ZmlsbHMgZmlsZS4gKi9cbmZ1bmN0aW9uIGFkZFBvbHlmaWxsKG9wdGlvbnM6IFNjaGVtYSk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBwcm9qZWN0TmFtZSA9IG9wdGlvbnMucHJvamVjdDtcblxuICAgIGlmICghcHJvamVjdE5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdPcHRpb24gXCJwcm9qZWN0XCIgaXMgcmVxdWlyZWQuJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgZ2V0V29ya3NwYWNlKGhvc3QpO1xuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHMuZ2V0KHByb2plY3ROYW1lKTtcblxuICAgIGlmICghcHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFByb2plY3QgJHtwcm9qZWN0TmFtZX0gaXMgbm90IGRlZmluZWQgaW4gdGhpcyB3b3Jrc3BhY2UuYCk7XG4gICAgfVxuXG4gICAgaWYgKHByb2plY3QuZXh0ZW5zaW9uc1sncHJvamVjdFR5cGUnXSAhPT0gJ2FwcGxpY2F0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgYEBhbmd1bGFyL2VsZW1lbnRzIHJlcXVpcmVzIGEgcHJvamVjdCB0eXBlIG9mIFwiYXBwbGljYXRpb25cIiBidXQgJHtwcm9qZWN0TmFtZX0gaXNuJ3QuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbGRUYXJnZXQgPSBwcm9qZWN0LnRhcmdldHMuZ2V0KCdidWlsZCcpO1xuICAgIGlmICghYnVpbGRUYXJnZXQgfHwgIWJ1aWxkVGFyZ2V0Lm9wdGlvbnMpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBDYW5ub3QgZmluZCAnb3B0aW9ucycgZm9yICR7cHJvamVjdE5hbWV9IGJ1aWxkIHRhcmdldC5gKTtcbiAgICB9XG5cbiAgICBjb25zdCB7cG9seWZpbGxzfSA9IGJ1aWxkVGFyZ2V0Lm9wdGlvbnM7XG4gICAgaWYgKHR5cGVvZiBwb2x5ZmlsbHMgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgcG9seWZpbGxzIGZvciAke3Byb2plY3ROYW1lfSBidWlsZCB0YXJnZXQgaXMgbm90IGEgc3RyaW5nLmApO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRlbnQgPSBob3N0LnJlYWQocG9seWZpbGxzKS50b1N0cmluZygpO1xuICAgIGlmICghY29udGVudC5pbmNsdWRlcygnZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudCcpKSB7XG4gICAgICAvLyBBZGQgc3RyaW5nIGF0IHRoZSBlbmQgb2YgdGhlIGZpbGUuXG4gICAgICBjb25zdCByZWNvcmRlciA9IGhvc3QuYmVnaW5VcGRhdGUocG9seWZpbGxzKTtcbiAgICAgIHJlY29yZGVyLmluc2VydFJpZ2h0KGNvbnRlbnQubGVuZ3RoLCBgaW1wb3J0ICdkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50JztcXG5gKTtcbiAgICAgIGhvc3QuY29tbWl0VXBkYXRlKHJlY29yZGVyKTtcbiAgICB9XG5cbiAgICBjb250ZXh0LmxvZ2dlci5pbmZvKCdBZGRlZCBcImRvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnRcIiB0byBwb2x5ZmlsbHMuJyk7XG4gIH07XG59XG4iXX0=