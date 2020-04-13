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
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var schematics_1 = require("@angular-devkit/schematics");
    var tasks_1 = require("@angular-devkit/schematics/tasks");
    var dependencies_1 = require("@schematics/angular/utility/dependencies");
    var workspace_1 = require("@schematics/angular/utility/workspace");
    function default_1(options) {
        return schematics_1.chain([
            options && options.skipPackageJson ? schematics_1.noop() : addPolyfillDependency(),
            addPolyfill(options),
        ]);
    }
    exports.default = default_1;
    /** Adds a package.json dependency for document-register-element */
    function addPolyfillDependency() {
        return function (host, context) {
            dependencies_1.addPackageJsonDependency(host, {
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
        return function (host, context) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var projectName, workspace, project, buildTarget, polyfills, content, recorder;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        projectName = options.project;
                        if (!projectName) {
                            throw new schematics_1.SchematicsException('Option "project" is required.');
                        }
                        return [4 /*yield*/, workspace_1.getWorkspace(host)];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zY2hlbWF0aWNzL25nLWFkZC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCx5REFBMEc7SUFDMUcsMERBQXdFO0lBQ3hFLHlFQUFzRztJQUN0RyxtRUFBbUU7SUFJbkUsbUJBQXdCLE9BQWU7UUFDckMsT0FBTyxrQkFBSyxDQUFDO1lBQ1gsT0FBTyxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGlCQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMscUJBQXFCLEVBQUU7WUFDckUsV0FBVyxDQUFDLE9BQU8sQ0FBQztTQUNyQixDQUFDLENBQUM7SUFDTCxDQUFDO0lBTEQsNEJBS0M7SUFFRCxtRUFBbUU7SUFDbkUsU0FBUyxxQkFBcUI7UUFDNUIsT0FBTyxVQUFDLElBQVUsRUFBRSxPQUF5QjtZQUMzQyx1Q0FBd0IsQ0FBQyxJQUFJLEVBQUU7Z0JBQzdCLElBQUksRUFBRSxpQ0FBa0IsQ0FBQyxPQUFPO2dCQUNoQyxJQUFJLEVBQUUsMkJBQTJCO2dCQUNqQyxPQUFPLEVBQUUsUUFBUTthQUNsQixDQUFDLENBQUM7WUFDSCxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO1lBRTFFLHlCQUF5QjtZQUN6QixPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksOEJBQXNCLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxtRUFBbUU7SUFDbkUsU0FBUyxXQUFXLENBQUMsT0FBZTtRQUFwQyxpQkF3Q0M7UUF2Q0MsT0FBTyxVQUFPLElBQVUsRUFBRSxPQUF5Qjs7Ozs7d0JBQzNDLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO3dCQUVwQyxJQUFJLENBQUMsV0FBVyxFQUFFOzRCQUNoQixNQUFNLElBQUksZ0NBQW1CLENBQUMsK0JBQStCLENBQUMsQ0FBQzt5QkFDaEU7d0JBRWlCLHFCQUFNLHdCQUFZLENBQUMsSUFBSSxDQUFDLEVBQUE7O3dCQUFwQyxTQUFTLEdBQUcsU0FBd0I7d0JBQ3BDLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQzt3QkFFcEQsSUFBSSxDQUFDLE9BQU8sRUFBRTs0QkFDWixNQUFNLElBQUksZ0NBQW1CLENBQUMsYUFBVyxXQUFXLHVDQUFvQyxDQUFDLENBQUM7eUJBQzNGO3dCQUVELElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsS0FBSyxhQUFhLEVBQUU7NEJBQ3ZELE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsc0VBQWtFLFdBQVcsWUFBUyxDQUFDLENBQUM7eUJBQzdGO3dCQUVLLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDakQsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7NEJBQ3hDLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQywrQkFBNkIsV0FBVyxtQkFBZ0IsQ0FBQyxDQUFDO3lCQUN6Rjt3QkFFTSxTQUFTLEdBQUksV0FBVyxDQUFDLE9BQU8sVUFBdkIsQ0FBd0I7d0JBQ3hDLElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUFFOzRCQUNqQyxNQUFNLElBQUksZ0NBQW1CLENBQUMsbUJBQWlCLFdBQVcsbUNBQWdDLENBQUMsQ0FBQzt5QkFDN0Y7d0JBRUssT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ2hELElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLDJCQUEyQixDQUFDLEVBQUU7NEJBRTVDLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzRCQUM3QyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsdUNBQXVDLENBQUMsQ0FBQzs0QkFDOUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQzt5QkFDN0I7d0JBRUQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaURBQWlELENBQUMsQ0FBQzs7OzthQUN4RSxDQUFDO0lBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7Y2hhaW4sIG5vb3AsIFJ1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7Tm9kZVBhY2thZ2VJbnN0YWxsVGFza30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuaW1wb3J0IHthZGRQYWNrYWdlSnNvbkRlcGVuZGVuY3ksIE5vZGVEZXBlbmRlbmN5VHlwZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2RlcGVuZGVuY2llcyc7XG5pbXBvcnQge2dldFdvcmtzcGFjZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3dvcmtzcGFjZSc7XG5cbmltcG9ydCB7U2NoZW1hfSBmcm9tICcuL3NjaGVtYSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG9wdGlvbnM6IFNjaGVtYSk6IFJ1bGUge1xuICByZXR1cm4gY2hhaW4oW1xuICAgIG9wdGlvbnMgJiYgb3B0aW9ucy5za2lwUGFja2FnZUpzb24gPyBub29wKCkgOiBhZGRQb2x5ZmlsbERlcGVuZGVuY3koKSxcbiAgICBhZGRQb2x5ZmlsbChvcHRpb25zKSxcbiAgXSk7XG59XG5cbi8qKiBBZGRzIGEgcGFja2FnZS5qc29uIGRlcGVuZGVuY3kgZm9yIGRvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQgKi9cbmZ1bmN0aW9uIGFkZFBvbHlmaWxsRGVwZW5kZW5jeSgpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgYWRkUGFja2FnZUpzb25EZXBlbmRlbmN5KGhvc3QsIHtcbiAgICAgIHR5cGU6IE5vZGVEZXBlbmRlbmN5VHlwZS5EZWZhdWx0LFxuICAgICAgbmFtZTogJ2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQnLFxuICAgICAgdmVyc2lvbjogJ14xLjcuMicsXG4gICAgfSk7XG4gICAgY29udGV4dC5sb2dnZXIuaW5mbygnQWRkZWQgXCJkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50XCIgYXMgYSBkZXBlbmRlbmN5LicpO1xuXG4gICAgLy8gSW5zdGFsbCB0aGUgZGVwZW5kZW5jeVxuICAgIGNvbnRleHQuYWRkVGFzayhuZXcgTm9kZVBhY2thZ2VJbnN0YWxsVGFzaygpKTtcbiAgfTtcbn1cblxuLyoqIEFkZHMgdGhlIGRvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQuanMgdG8gdGhlIHBvbHlmaWxscyBmaWxlLiAqL1xuZnVuY3Rpb24gYWRkUG9seWZpbGwob3B0aW9uczogU2NoZW1hKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHByb2plY3ROYW1lID0gb3B0aW9ucy5wcm9qZWN0O1xuXG4gICAgaWYgKCFwcm9qZWN0TmFtZSkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ09wdGlvbiBcInByb2plY3RcIiBpcyByZXF1aXJlZC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCBnZXRXb3Jrc3BhY2UoaG9zdCk7XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0cy5nZXQocHJvamVjdE5hbWUpO1xuXG4gICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUHJvamVjdCAke3Byb2plY3ROYW1lfSBpcyBub3QgZGVmaW5lZCBpbiB0aGlzIHdvcmtzcGFjZS5gKTtcbiAgICB9XG5cbiAgICBpZiAocHJvamVjdC5leHRlbnNpb25zWydwcm9qZWN0VHlwZSddICE9PSAnYXBwbGljYXRpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICBgQGFuZ3VsYXIvZWxlbWVudHMgcmVxdWlyZXMgYSBwcm9qZWN0IHR5cGUgb2YgXCJhcHBsaWNhdGlvblwiIGJ1dCAke3Byb2plY3ROYW1lfSBpc24ndC5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsZFRhcmdldCA9IHByb2plY3QudGFyZ2V0cy5nZXQoJ2J1aWxkJyk7XG4gICAgaWYgKCFidWlsZFRhcmdldCB8fCAhYnVpbGRUYXJnZXQub3B0aW9ucykge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYENhbm5vdCBmaW5kICdvcHRpb25zJyBmb3IgJHtwcm9qZWN0TmFtZX0gYnVpbGQgdGFyZ2V0LmApO1xuICAgIH1cblxuICAgIGNvbnN0IHtwb2x5ZmlsbHN9ID0gYnVpbGRUYXJnZXQub3B0aW9ucztcbiAgICBpZiAodHlwZW9mIHBvbHlmaWxscyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBwb2x5ZmlsbHMgZm9yICR7cHJvamVjdE5hbWV9IGJ1aWxkIHRhcmdldCBpcyBub3QgYSBzdHJpbmcuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGVudCA9IGhvc3QucmVhZChwb2x5ZmlsbHMpLnRvU3RyaW5nKCk7XG4gICAgaWYgKCFjb250ZW50LmluY2x1ZGVzKCdkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50JykpIHtcbiAgICAgIC8vIEFkZCBzdHJpbmcgYXQgdGhlIGVuZCBvZiB0aGUgZmlsZS5cbiAgICAgIGNvbnN0IHJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShwb2x5ZmlsbHMpO1xuICAgICAgcmVjb3JkZXIuaW5zZXJ0UmlnaHQoY29udGVudC5sZW5ndGgsIGBpbXBvcnQgJ2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQnO1xcbmApO1xuICAgICAgaG9zdC5jb21taXRVcGRhdGUocmVjb3JkZXIpO1xuICAgIH1cblxuICAgIGNvbnRleHQubG9nZ2VyLmluZm8oJ0FkZGVkIFwiZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudFwiIHRvIHBvbHlmaWxscy4nKTtcbiAgfTtcbn1cbiJdfQ==