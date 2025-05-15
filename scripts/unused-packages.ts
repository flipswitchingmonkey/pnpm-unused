import yaml from 'yaml'
import { readFileSync } from 'fs'
import { list } from '@pnpm/list'
import { parseArgs } from 'util'

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    root: {
      type: 'string',
      default: '..',
    },
  },
  strict: true,
  allowPositionals: true,
})
const root = values.root

type WorkspaceType = {
  packages: string[]
  catalog: Record<string, string>
  onlyBuiltDependencies: string[]
}

const file = readFileSync(`${root}/pnpm-workspace.yaml`, 'utf8')
const workspace = yaml.parse(file) as WorkspaceType

type DepType = {
  name: string
  version: string
  workspaceVersion: string
  project: string
  projectPath: string
  section: 'dependencies' | 'devDependencies' | 'optionalDependencies' | 'peerDependencies' | 'overrides'
}

const result = await list(
  workspace.packages.map((e: string) => `${root}/${e}`),
  {
    lockfileDir: root,
    depth: 0,
    virtualStoreDirMaxLength: 0,
    onlyProjects: false,
    reportAs: 'json',
  }
)

const notInWorkspace: DepType[] = []
const inWorkspaceButVersioned: DepType[] = []
const depsUsedSomewhere: Set<string> = new Set()
const depsNotUsedAnywhere: { package: string; version: string }[] = []

const json = JSON.parse(result)
if (!json || !Array.isArray(json) || !json.length) {
  console.log('No dependencies found')
  process.exit(0)
}

function loopThroughDeps(project: any, deps: Record<string, any>, section: DepType['section']) {
  if (deps) {
    Object.entries(deps).forEach(
      ([dep, details]: [string, { from: string; version: string; resolved: string; path: string }]) => {
        depsUsedSomewhere.add(dep)
        const color = details.version.startsWith('link:') ? '\x1b[1;34m' : '\x1b[1;32m'
        if (!workspace.catalog[dep]) {
          if (details.version.startsWith('link:')) {
            return
          }
          notInWorkspace.push({
            name: `${color}${dep}\x1b[0m`,
            version: details.version,
            workspaceVersion: 'n/a',
            project: project.name,
            projectPath: project.path,
            section,
          })
        } else if (details.version !== workspace.catalog[dep]) {
          // console.log(details)
          inWorkspaceButVersioned.push({
            name: `${color}${dep}\x1b[0m`,
            version: details.version,
            workspaceVersion: workspace.catalog[dep],
            project: project.name,
            projectPath: project.path,
            section,
          })
        }
      }
    )
  }
}

json.forEach((e: any) => {
  loopThroughDeps(e, e.dependencies, 'dependencies')
  loopThroughDeps(e, e.devDependencies, 'devDependencies')
  loopThroughDeps(e, e.optionalDependencies, 'optionalDependencies')
  loopThroughDeps(e, e.peerDependencies, 'peerDependencies')
  loopThroughDeps(e, e.overrides, 'overrides')
})

Object.entries(workspace.catalog).forEach(([dep, version]) => {
  if (!depsUsedSomewhere.has(dep)) {
    depsNotUsedAnywhere.push({ package: `\x1b[1;32m${dep}\x1b[0m`, version: version as string })
  }
})

if (depsNotUsedAnywhere.length > 0) {
  console.log('\x1b[1;33m🚫 Unused, but in workspace catalog:\x1b[0m')
  console.table(depsNotUsedAnywhere)
  console.log('')
} else {
  console.log('\x1b[1;32m✅ No unused dependencies in workspace catalog\x1b[0m')
}

if (notInWorkspace.length > 0) {
  console.log('\x1b[1;33m🚫 Used in project, but not in catalog:\x1b[0m')
  console.table(notInWorkspace)
} else {
  console.log('\x1b[1;32m✅ No dependencies used in project, but not in catalog\x1b[0m')
}

if (inWorkspaceButVersioned.length > 0) {
  console.log('\x1b[1;33m🚫 Used in project with a version, and also in catalog:\x1b[0m')
  console.table(inWorkspaceButVersioned)
} else {
  console.log('\x1b[1;32m✅ No dependencies used in project with a version, and also in catalog\x1b[0m')
}
