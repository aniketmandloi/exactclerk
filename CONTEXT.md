# ExactClerk

A title-paperwork service for small independent used-car dealers: it checks a sale's paperwork against the state's rules, files it, and chases any rejection until the title clears.

## Language

**Dealer**:
An independent used-car business that sells vehicles and pays for ExactClerk.
_Avoid_: Customer, client, lot

**Buyer**:
The person who purchases a vehicle from a Dealer.
_Avoid_: Customer, consumer

**Deal**:
One vehicle sale or acquisition by a Dealer that produces title work.
_Avoid_: Transaction, order

**Title Packet**:
The documents for one Deal that a state needs in order to transfer a title.
_Avoid_: Paperwork, submission, file

**Title Authority**:
The state agency that accepts a Title Packet and issues or records the title (usually the DMV).
_Avoid_: DMV, the state

**State Ruleset**:
The versioned set of requirements one state imposes on a Title Packet.
_Avoid_: Regulations, checklist

**Preflight Check**:
A run of a Title Packet against a State Ruleset before Filing, producing Findings.
_Avoid_: Validation, audit

**Finding**:
One specific defect or missing item a Preflight Check flags, tied to the rule it violates.
_Avoid_: Error, warning

**Filing Channel**:
The route by which a Title Packet reaches a Title Authority: an electronic system, a portal, mail, or an agent.
_Avoid_: Integration, API

**Filing**:
The submission of a Title Packet to a Title Authority through a Filing Channel.
_Avoid_: Submission

**Rejection**:
A Title Authority returning a Filing as defective.
_Avoid_: Bounce, denial

**Chase**:
The work of resolving a Rejection and refiling until the title clears.
_Avoid_: Follow-up, retry

**Cleared**:
The state in which the Title Authority has completed the title transfer for a Deal.
_Avoid_: Done, approved
