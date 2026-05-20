# Kirigami deployment certificates

Place the deployment self-signed certificate and key here:

- `kirigami.crt`
- `kirigami.key`

These files are mounted read-only into the Caddy container at `/etc/caddy/certs`.
The private key is ignored by Git and should not be committed.
