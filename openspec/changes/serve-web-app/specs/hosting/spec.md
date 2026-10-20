## ADDED Requirements

### Requirement: One address for the whole game
When the server is given the folder of the built web app, it SHALL serve the game from its own address:
- a request for a file in that folder SHALL get the file with its content type;
- files under `/assets/` SHALL be cacheable for a year, since their names change with every build; every other file,
  and the app page, SHALL be revalidated on each visit;
- any other page link without a file extension SHALL get the app page, so the web app can open that page;
- a missing file with an extension SHALL get 404;
- a path that leaves the folder SHALL NOT be served;
- the socket connection and the admin session route SHALL keep working on the same address.

When the server is not given that folder, it SHALL serve no pages.

#### Scenario: Opening the game
- **WHEN** Caro opens the game's address
- **THEN** Caro gets the web app

#### Scenario: Opening a room link
- **WHEN** Caro opens `/room/ABCD` from a shared link
- **THEN** Caro gets the web app, which opens room ABCD

#### Scenario: Built files
- **WHEN** the browser asks for `/assets/index-abc123.js`
- **THEN** it gets the script with a JavaScript content type and a one-year cache

#### Scenario: Missing file
- **WHEN** the browser asks for `/assets/gone.js`, which is not in the build
- **THEN** it gets 404

#### Scenario: Escaping the folder
- **WHEN** someone asks for `/../package.json`
- **THEN** no file outside the build folder is served

#### Scenario: Playing on the same address
- **WHEN** the server serves the web app and Caro's browser opens a socket to the same address
- **THEN** Caro can create a room as usual

#### Scenario: No build given
- **WHEN** the server runs without the web app's folder
- **THEN** page requests get 404 and the socket still works
