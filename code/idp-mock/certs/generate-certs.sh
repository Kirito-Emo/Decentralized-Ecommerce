# SPDX-License-Identifier: Apache-2.0
# Copyright 2025 Emanuele Relmi

# This script generates an Ed25519 key pair in JWK format, usable for both SAML signature and VC.

# Generate Ed25519 key pair using openssl
openssl genpkey -algorithm RSA -out certs/idp_key.pem -pkeyopt rsa_keygen_bits:2048

# Extract public key
openssl req -new -x509 -key certs/idp_key.pem -out certs/idp_cert.pem -days 365 -subj "/CN=localhost"

# Copy public key to Backend directory
mkdir -p ../backend/certs
cp certs/idp_cert.pem ../backend/certs/idp_cert.pem

echo "✅ RSA key pair generated:"
echo "- Private: certs/idp_key.pem"
echo "- Public : certs/idp_pub.pem"