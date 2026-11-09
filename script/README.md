# Maintained tools and local experiments

Tracked scripts are reusable project tooling: setup, builds, data preparation,
validation, or CI. A script needed only to investigate a task belongs in
`script/local/`. Only its `.gitkeep` is versioned; Git, EAS, lint, formatting,
TypeScript, architecture checks, and test discovery exclude its contents.

Use repository-relative paths and explicit emulator serials. Save diagnostic
outputs in `.maestro/artifacts/`, not alongside maintained sources. Do not link
tracked documentation or tests to a local script: it will be absent from a
fresh checkout. Preserve useful conclusions as concise coverage limitations or
reusable instructions.

Maintained code and tests must not import local scripts; the architecture check
rejects those dependencies even when the experiment happens to exist locally.

Promote an experiment only when there is a recurring project need, a stable
interface, appropriate tests, and an explicit maintained validation command.
Then move it outside `local/` and document exactly which guarantees it checks.
`npm run check:validation` rejects task-local files added with `git add -f`.
