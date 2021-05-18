import { __awaiter } from "tslib";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { chain, noop, SchematicsException } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addPackageJsonDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { getWorkspace } from '@schematics/angular/utility/workspace';
export default function (options) {
    return chain([
        options && options.skipPackageJson ? noop() : addPolyfillDependency(),
        addPolyfill(options),
    ]);
}
/** Adds a package.json dependency for document-register-element */
function addPolyfillDependency() {
    return (host, context) => {
        addPackageJsonDependency(host, {
            type: NodeDependencyType.Default,
            name: 'document-register-element',
            version: '^1.7.2',
        });
        context.logger.info('Added "document-register-element" as a dependency.');
        // Install the dependency
        context.addTask(new NodePackageInstallTask());
    };
}
/** Adds the document-register-element.js to the polyfills file. */
function addPolyfill(options) {
    return (host, context) => __awaiter(this, void 0, void 0, function* () {
        const projectName = options.project;
        if (!projectName) {
            throw new SchematicsException('Option "project" is required.');
        }
        const workspace = yield getWorkspace(host);
        const project = workspace.projects.get(projectName);
        if (!project) {
            throw new SchematicsException(`Project ${projectName} is not defined in this workspace.`);
        }
        if (project.extensions['projectType'] !== 'application') {
            throw new SchematicsException(`@angular/elements requires a project type of "application" but ${projectName} isn't.`);
        }
        const buildTarget = project.targets.get('build');
        if (!buildTarget || !buildTarget.options) {
            throw new SchematicsException(`Cannot find 'options' for ${projectName} build target.`);
        }
        const { polyfills } = buildTarget.options;
        if (typeof polyfills !== 'string') {
            throw new SchematicsException(`polyfills for ${projectName} build target is not a string.`);
        }
        const content = host.read(polyfills).toString();
        if (!content.includes('document-register-element')) {
            // Add string at the end of the file.
            const recorder = host.beginUpdate(polyfills);
            recorder.insertRight(content.length, `import 'document-register-element';\n`);
            host.commitUpdate(recorder);
        }
        context.logger.info('Added "document-register-element" to polyfills.');
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zY2hlbWF0aWNzL25nLWFkZC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQTBCLG1CQUFtQixFQUFPLE1BQU0sNEJBQTRCLENBQUM7QUFDMUcsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sa0NBQWtDLENBQUM7QUFDeEUsT0FBTyxFQUFDLHdCQUF3QixFQUFFLGtCQUFrQixFQUFDLE1BQU0sMENBQTBDLENBQUM7QUFDdEcsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHVDQUF1QyxDQUFDO0FBSW5FLE1BQU0sQ0FBQyxPQUFPLFdBQVUsT0FBZTtJQUNyQyxPQUFPLEtBQUssQ0FBQztRQUNYLE9BQU8sSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMscUJBQXFCLEVBQUU7UUFDckUsV0FBVyxDQUFDLE9BQU8sQ0FBQztLQUNyQixDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsbUVBQW1FO0FBQ25FLFNBQVMscUJBQXFCO0lBQzVCLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQy9DLHdCQUF3QixDQUFDLElBQUksRUFBRTtZQUM3QixJQUFJLEVBQUUsa0JBQWtCLENBQUMsT0FBTztZQUNoQyxJQUFJLEVBQUUsMkJBQTJCO1lBQ2pDLE9BQU8sRUFBRSxRQUFRO1NBQ2xCLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLG9EQUFvRCxDQUFDLENBQUM7UUFFMUUseUJBQXlCO1FBQ3pCLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxzQkFBc0IsRUFBRSxDQUFDLENBQUM7SUFDaEQsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELG1FQUFtRTtBQUNuRSxTQUFTLFdBQVcsQ0FBQyxPQUFlO0lBQ2xDLE9BQU8sQ0FBTyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQ3JELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFFcEMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNoQixNQUFNLElBQUksbUJBQW1CLENBQUMsK0JBQStCLENBQUMsQ0FBQztTQUNoRTtRQUVELE1BQU0sU0FBUyxHQUFHLE1BQU0sWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNDLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXBELElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixNQUFNLElBQUksbUJBQW1CLENBQUMsV0FBVyxXQUFXLG9DQUFvQyxDQUFDLENBQUM7U0FDM0Y7UUFFRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEtBQUssYUFBYSxFQUFFO1lBQ3ZELE1BQU0sSUFBSSxtQkFBbUIsQ0FDekIsa0VBQWtFLFdBQVcsU0FBUyxDQUFDLENBQUM7U0FDN0Y7UUFFRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRTtZQUN4QyxNQUFNLElBQUksbUJBQW1CLENBQUMsNkJBQTZCLFdBQVcsZ0JBQWdCLENBQUMsQ0FBQztTQUN6RjtRQUVELE1BQU0sRUFBQyxTQUFTLEVBQUMsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBQ3hDLElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUFFO1lBQ2pDLE1BQU0sSUFBSSxtQkFBbUIsQ0FBQyxpQkFBaUIsV0FBVyxnQ0FBZ0MsQ0FBQyxDQUFDO1NBQzdGO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNoRCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsQ0FBQyxFQUFFO1lBQ2xELHFDQUFxQztZQUNyQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdDLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO1lBQzlFLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDN0I7UUFFRCxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO0lBQ3pFLENBQUMsQ0FBQSxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtjaGFpbiwgbm9vcCwgUnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtOb2RlUGFja2FnZUluc3RhbGxUYXNrfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90YXNrcyc7XG5pbXBvcnQge2FkZFBhY2thZ2VKc29uRGVwZW5kZW5jeSwgTm9kZURlcGVuZGVuY3lUeXBlfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvZGVwZW5kZW5jaWVzJztcbmltcG9ydCB7Z2V0V29ya3NwYWNlfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvd29ya3NwYWNlJztcblxuaW1wb3J0IHtTY2hlbWF9IGZyb20gJy4vc2NoZW1hJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ob3B0aW9uczogU2NoZW1hKTogUnVsZSB7XG4gIHJldHVybiBjaGFpbihbXG4gICAgb3B0aW9ucyAmJiBvcHRpb25zLnNraXBQYWNrYWdlSnNvbiA/IG5vb3AoKSA6IGFkZFBvbHlmaWxsRGVwZW5kZW5jeSgpLFxuICAgIGFkZFBvbHlmaWxsKG9wdGlvbnMpLFxuICBdKTtcbn1cblxuLyoqIEFkZHMgYSBwYWNrYWdlLmpzb24gZGVwZW5kZW5jeSBmb3IgZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudCAqL1xuZnVuY3Rpb24gYWRkUG9seWZpbGxEZXBlbmRlbmN5KCk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBhZGRQYWNrYWdlSnNvbkRlcGVuZGVuY3koaG9zdCwge1xuICAgICAgdHlwZTogTm9kZURlcGVuZGVuY3lUeXBlLkRlZmF1bHQsXG4gICAgICBuYW1lOiAnZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudCcsXG4gICAgICB2ZXJzaW9uOiAnXjEuNy4yJyxcbiAgICB9KTtcbiAgICBjb250ZXh0LmxvZ2dlci5pbmZvKCdBZGRlZCBcImRvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnRcIiBhcyBhIGRlcGVuZGVuY3kuJyk7XG5cbiAgICAvLyBJbnN0YWxsIHRoZSBkZXBlbmRlbmN5XG4gICAgY29udGV4dC5hZGRUYXNrKG5ldyBOb2RlUGFja2FnZUluc3RhbGxUYXNrKCkpO1xuICB9O1xufVxuXG4vKiogQWRkcyB0aGUgZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudC5qcyB0byB0aGUgcG9seWZpbGxzIGZpbGUuICovXG5mdW5jdGlvbiBhZGRQb2x5ZmlsbChvcHRpb25zOiBTY2hlbWEpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgcHJvamVjdE5hbWUgPSBvcHRpb25zLnByb2plY3Q7XG5cbiAgICBpZiAoIXByb2plY3ROYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignT3B0aW9uIFwicHJvamVjdFwiIGlzIHJlcXVpcmVkLicpO1xuICAgIH1cblxuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZShob3N0KTtcbiAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChwcm9qZWN0TmFtZSk7XG5cbiAgICBpZiAoIXByb2plY3QpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBQcm9qZWN0ICR7cHJvamVjdE5hbWV9IGlzIG5vdCBkZWZpbmVkIGluIHRoaXMgd29ya3NwYWNlLmApO1xuICAgIH1cblxuICAgIGlmIChwcm9qZWN0LmV4dGVuc2lvbnNbJ3Byb2plY3RUeXBlJ10gIT09ICdhcHBsaWNhdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgIGBAYW5ndWxhci9lbGVtZW50cyByZXF1aXJlcyBhIHByb2plY3QgdHlwZSBvZiBcImFwcGxpY2F0aW9uXCIgYnV0ICR7cHJvamVjdE5hbWV9IGlzbid0LmApO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWxkVGFyZ2V0ID0gcHJvamVjdC50YXJnZXRzLmdldCgnYnVpbGQnKTtcbiAgICBpZiAoIWJ1aWxkVGFyZ2V0IHx8ICFidWlsZFRhcmdldC5vcHRpb25zKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ2Fubm90IGZpbmQgJ29wdGlvbnMnIGZvciAke3Byb2plY3ROYW1lfSBidWlsZCB0YXJnZXQuYCk7XG4gICAgfVxuXG4gICAgY29uc3Qge3BvbHlmaWxsc30gPSBidWlsZFRhcmdldC5vcHRpb25zO1xuICAgIGlmICh0eXBlb2YgcG9seWZpbGxzICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYHBvbHlmaWxscyBmb3IgJHtwcm9qZWN0TmFtZX0gYnVpbGQgdGFyZ2V0IGlzIG5vdCBhIHN0cmluZy5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZW50ID0gaG9zdC5yZWFkKHBvbHlmaWxscykudG9TdHJpbmcoKTtcbiAgICBpZiAoIWNvbnRlbnQuaW5jbHVkZXMoJ2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQnKSkge1xuICAgICAgLy8gQWRkIHN0cmluZyBhdCB0aGUgZW5kIG9mIHRoZSBmaWxlLlxuICAgICAgY29uc3QgcmVjb3JkZXIgPSBob3N0LmJlZ2luVXBkYXRlKHBvbHlmaWxscyk7XG4gICAgICByZWNvcmRlci5pbnNlcnRSaWdodChjb250ZW50Lmxlbmd0aCwgYGltcG9ydCAnZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudCc7XFxuYCk7XG4gICAgICBob3N0LmNvbW1pdFVwZGF0ZShyZWNvcmRlcik7XG4gICAgfVxuXG4gICAgY29udGV4dC5sb2dnZXIuaW5mbygnQWRkZWQgXCJkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50XCIgdG8gcG9seWZpbGxzLicpO1xuICB9O1xufVxuIl19