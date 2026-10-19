# Agentation Workflow

`Agentation.dev` is a good fit for this template as a visual review layer for AI-assisted edits, not as a CMS.

## Recommended Use
- Run the site locally.
- Open the page you want to adjust.
- Use Agentation to click or annotate a section visually.
- Pass the generated feedback to your coding agent.
- Let the agent update either `src/content/*` data files or the shared renderers/components.

## Best Use Cases In This Template
- Adjust spacing, typography, and block ordering on project pages.
- Call out which section on `/office` or `/projects` should change.
- Review newly authored case studies built from fixed blocks.
- Point at a specific homepage section without describing it verbally.

## Not Recommended
- Using Agentation as a content database.
- Treating Agentation as a page builder.
- Replacing the content model in `src/content/*`.

## Editing Rule Of Thumb
- Content change: edit `src/content/*`.
- Layout/system change: edit `src/components/*` or route renderers.
- Visual review and AI instructions: use Agentation on top of the running app.
