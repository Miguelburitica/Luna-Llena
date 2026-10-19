## ADDED Requirements

### Requirement: Return to your seat
When the device still holds a member's seat, the web app SHALL offer to return to it. The home page SHALL show a
"Return to your seat" action with the room code. The join page SHALL show "Return to my seat" in place of the name form
and the room's closed notice when the entered code matches the saved seat. Choosing it SHALL resume the seat and take
the member to the lobby, or to the game when one is running. If the seat no longer exists, the app SHALL say "Your
seat is gone. Join again with the code.", forget the saved seat and show the normal join form. A member who leaves the
room on purpose SHALL no longer be offered the seat.

#### Scenario: Back out mid-game
- **WHEN** Caro is seated in a running game, presses back on their phone and lands on the join page for that room
- **THEN** Caro sees "Return to my seat" instead of "This village is mid-game", and choosing it puts Caro back in the
  game in the same seat

#### Scenario: Home page remembers the seat
- **WHEN** Caro opens the home page while the device holds Caro's seat in room ABCD
- **THEN** the home page shows "Return to your seat" for room ABCD, and choosing it takes Caro back to that room

#### Scenario: Seat is gone
- **WHEN** Caro chooses to return to a seat that the room no longer has
- **THEN** Caro is told the seat is gone, the return offer disappears and the join form is shown

#### Scenario: Another room
- **WHEN** Caro holds a seat in room ABCD and enters code WXYZ on the join page
- **THEN** the join page shows the normal join form for WXYZ

#### Scenario: Left on purpose
- **WHEN** Caro leaves the lobby with the leave button and opens the home page
- **THEN** no return offer is shown
