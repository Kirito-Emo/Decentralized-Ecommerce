# SPDX-License-Identifier: Apache-2.0
# Copyright 2025 Emanuele Relmi

# 1) Generate the secret key
openssl genpkey -algorithm ed25519 -out sp-private.key
base64 -w0 sp-private.key  > key.b64      # ENCONDING TO BASE64

# 2) Generate a self-signed certificate (validity = 1 year)
openssl req -new -x509 -key sp-private.key -out sp-public.crt -days 365 -subj "/C=IT/ST=Rome/L=Rome/O=UniSA/OU=DIEM/CN=ReviewDApp.test"
base64 -w0 sp-public.crt > cert.b64       # ENCONDING TO BASE64

# 3) Generate 32 bytes (256 bit) base64
openssl rand -base64 32                   # SESSION_SECRET
openssl rand -base64 32                   # JWT_SECRET