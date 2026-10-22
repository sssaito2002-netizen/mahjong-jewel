# CPU decision policy

The CPU receives its own Player view. It uses its own physical hand, public discards, exposed melds, riichi declarations and visible dora indicators. It never reads opponents' concealed tiles, the wall or ura indicators.

Discard priorities combine shanten, remaining improving tiles, retained gem effects and (at tenpai) completed-hand scoring with the same engine as the game. Ordinary and gem versions of a draw are weighted separately. Eligible drawn pocchi are evaluated as wildcards. Expected points and chips influence equal-speed choices; retaining a gem does not justify losing a full shanten in an unthreatened hand. Against riichi, known safe tiles are preferred over similarly fast dangerous discards.

Winning choices compare the legal Carnelian modes by actual points and chip value. Calls are evaluated after their mandatory discard, require improved shanten and a supported open-yaku route, and are declined against riichi. Speculative kans are not added by this change.

This is a bounded heuristic, not a solved optimal policy. Chip value is a fixed decision weight of 250 point-equivalent units per chip, not a rule converting chips to points. Incomplete-hand gem estimates and safety estimates are approximate; hidden ura are not predicted. Match-rank-aware endgame search is not implemented.

Validation: targeted gem-retention, live-wait, riichi safety, hidden-information isolation, Carnelian and call fixtures, plus complete CPU matches and existing online integration/browser smoke tests.
