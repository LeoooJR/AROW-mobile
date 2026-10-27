# Map Adapter Working Rules

Read this file and the [component context](../../CONTEXT.md) before starting
work in this directory. Review the completion checklist before submitting.

## Before changing files

- Trace the affected code, callers and tests before choosing an approach.
- Use the current request to determine the intended change. Existing
  implementation choices are not permanent requirements.
- Follow the repository's design and validation guidance when applicable.

## Naming and organization

- Use kebab-case filenames that describe a responsibility.
- Avoid a redundant `map-` prefix; retain it when it improves clarity.
- Keep tests beside their subject and platform variants beside the base file.
- Keep helpers local to their owner until reuse justifies a separate module.
- Prefer direct imports over barrel exports or forwarding wrappers.

## Implementation discipline

- Keep MapLibre-specific integration inside this adapter and business workflows
  with their owning features.
- Keep interfaces narrow and explicitly typed; avoid circular dependencies.
- Choose descriptive names and small, cohesive functions. Extract helpers when
  they clarify intent, not merely to shorten a function.
- Keep changes focused on the request and preserve unrelated work.
- Update affected callers, tests and regular documentation when changing a
  contract or behavior.

## Completion checklist

- Check that filenames, imports and test mocks remain consistent after moves.
- Check that the diff contains only intended changes.
- Run the applicable checks from the
  [validation guide](../../../../docs/agents/validation.md) and report any gaps.
- Follow the [Android workflow](../../../../docs/agents/android.md) when device
  validation is needed; honor the requested evidence format.
- Check this Markdown file with Prettier whenever it changes.

## Maintaining this file

Keep only reusable working rules here. Put behavior descriptions, algorithms,
numerical policies and implementation walkthroughs in regular documentation.
Do not add feature inventories, task histories or rules that freeze a particular
solution. Add a lesson only when it improves how future work is carried out.
