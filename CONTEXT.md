# ExactClerk

A title-paperwork service for small independent used-car dealers: it checks a sale's paperwork against the state's rules, files it, and chases any rejection until the title clears.

## Language

**Dealer**:
An independent used-car business that sells vehicles and pays for ExactClerk. User-facing copy says "dealership" where someone names or joins the business.
_Avoid_: Customer, client, lot

**Buyer**:
The person who purchases a vehicle from a Dealer.
_Avoid_: Customer, consumer

**Deal**:
One vehicle sale or acquisition by a Dealer that produces title work.
_Avoid_: Transaction, order

**Price tier**:
What a Deal costs, set by facts known when it is opened: Standard, Lien (a lienholder is involved) or Complex (out-of-state title, salvage, bonded, or a power-of-attorney sale). The Dealer approves it before the Deal leaves Draft.
_Avoid_: Plan, package

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

**Rule**:
One requirement in a State Ruleset, with its source citation, the situations it applies to, and the Finding it produces.
_Avoid_: Validation, check

**Finding**:
One specific item a Preflight Check flags, tied to the Rule that produced it. It is a Defect, a Confirm, or an Advisory.
_Avoid_: Error, warning

**Defect**:
A Finding where the Title Packet breaks a Rule; blocks Filing.
_Avoid_: Error

**Confirm**:
A Finding where a document read or Dealer-entered value is uncertain; blocks clerk review until the Dealer answers.
_Avoid_: Warning

**Advisory**:
A Finding that informs but does not block.
_Avoid_: Note, warning

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
