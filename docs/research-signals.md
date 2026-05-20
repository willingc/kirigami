# Research on conversation signals

Two promising efforts about identifying signals in coversations, especially
when the reader is trying to catch up after an absence from the conversation.

## Cornell work

Relevant prior work: there's a 2013 paper by Backstrom, Kleinberg, Lee, and [**Danescu-Niculescu-Mizil (Cornell)**](https://www.cs.cornell.edu/~cristian/) called "Characterizing and Curating Conversation Threads: Expansion, Focus, Volume, Re-entry." It introduced what they called the novel task of re-entry prediction — predicting whether a user who has participated in a thread will later contribute another comment to it, motivated explicitly by the goal of helping determine whether users should be kept notified of the progress of a thread they've already contributed to

## Wikum and Zhang

Another highly relevant project is Wikum, a CSCW paper from a University of Washington / MIT group (Amy Zhang and collaborators). Wikum tackles large, complicated discussions with many branches and back-and-forth tangents, where you have to wade through the whole thing to know if any conclusions or retractions have been made. Their solution is **recursive human summarization** — readers select a subthread, summarize it, and that summary replaces the subthread in the view for future visitors, who can toggle to see the original.
