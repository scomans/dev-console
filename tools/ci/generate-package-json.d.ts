interface PackageJsonPlugin {
  project: string;
  implicitDependencies?: string[];
  filterDependencies?: string[];
  scripts?: { [command: string]: string }
}

export default function packageJsonPlugin<T>(options: PackageJsonPlugin): (config: T, context) => T;
