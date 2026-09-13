# Security Policy

## Reporting a vulnerability

`@brashkie/waproto` parses untrusted binary data from the network. If you find a
vulnerability (e.g. a crafted message that causes a crash, hang, or out-of-bounds
read), please report it privately:

- Open a [security advisory](https://github.com/Brashkie/waproto/security/advisories/new), or
- Contact the maintainer through the Hepein ecosystem.

Please **do not** open a public issue for security problems.

## Scope

waproto is a thin TypeScript layer over `@brashkie/signalis-codec`. The
bounds-checking, depth-limiting, and "never panic on malformed input" guarantees
live in that codec. Parsing-safety issues in the wire format itself should be
reported against `signalis-codec`; waproto issues concern the schema/model layer.

## Supported versions

The latest published `0.x` release is supported. During `0.x`, breaking changes
may land in minor versions per semver.
