# Systems Thinking

## Primary Goals

- Save time
- Gain context
- Deepen understanding

The initial goals are to create a tool that allows viewing individual messages and metadata
in a way that allows the reader to view the conversation in different ways. Culling out
the noise (cutting some messages) and focusing on the signal of the conversation.

## Collection of Messages (aka Topic or Thread)

*It would be nice to have a generic way to refer to the collection that doesn't evoke preconceived notions based on the messaging platform.*

Possibilities:
- collection
- set
- topic
- thread
- **conversation**
- discussion
- series
- chain
- sequence

For now, I'll use "conversation" as a placeholder.

## Metadata

### Conversation

- title
- id
- first_message_author
- first_message_timestamp
- estimated_read_time
- last_post_timestamp
- calculated_conversation_length
- number_of_messages
- number_of_unique_authors

### Individual message
- id
- author_name
- author_id
- timestamp
- message_length
- messaage_text
- response_to_message_id
- contains_link

### Author

- id
- name
- username
- additional_privileges (bool)

## Shape of data

This allows visualization of the data.

- Timeline of messages
- Tree of messages
- Cluster messages by author
- Cluster message by keyword

## Calculated Info and Metrics

Initial set of calculated metrics

### Conversation Metrics

- messages_per_day
- median_timestamp
- 75_timestamp
- 90_timestamp
- 25_timestamp

## Blocks

- Ingest messages
- Display conversation metadata
- Display authors
- Display frequent authors
- Display message
- Display message metadata
- Display shape of data

### Ingest messages

Plug-in support for different messaging platforms

- Discourse
- Email
- Discord
- Slack
