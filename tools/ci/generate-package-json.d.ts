interface PackageJsonPlugin {
  project: string;
  implicitDependencies?: string[];
  filterDependencies?: string[];
  scripts?: { [command: string]: string };
  name?: string;
  productName?: string;
}

export default function packageJsonPlugin<T>(options: PackageJsonPlugin): (config: T, context) => T;
