# Relationship Tree checks

Node 24: `npm install --no-save --package-lock=false --ignore-scripts jsdom@30.1.3`
then `node --test tests/relationship-tree-repair.test.cjs`.

These exercise actual timeline handlers and the connection editor, including
storage failure, duplicate links, removal, phase highlighting and playback.
They do not measure device frame rates or replace touch tests on Android.
