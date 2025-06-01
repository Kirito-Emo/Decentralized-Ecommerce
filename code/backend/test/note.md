# 🧪 SPID Backend + Mock IdP — Test Guide

## 🔧 1. Setup Backend
```bash
  cd backend
  npm install
```

## 📜 2. Generate Self-Signed Certificates
If not already present:
```bash
  cd ../../idp-mock/certs/
  chmod +x generate-certs.sh
  ./generate-certs.sh
```

## ▶️ 3. Run the Backend Server
```bash
    npx ts-node server.ts
```
> You should see:
>> `SPID backend listening on http://localhost:8082`

## 🔧 4. Setup Mock Identity Provider
```bash
    cd ../idp-mock
    npm install
```
> Ensure it uses the same `certs/idp_cert.pem` and `certs/idp_key.pem` as the backend.

## ▶️ 4. Run the Mock IdP
```bash
    npx ts-node server.ts
```
> Expected output:
>> `Mock IdP listening on http://localhost:8443`

## 🧪 5. Test the SPID Login Flow
Visit in your browser [localhost:8082/login](http://localhost:8082/login
)

You will:
1. Be redirected to the mock IdP at [localhost:8443/sso](http://localhost:8443/sso)
2. Click the “Login” button (for testuser@spid.it)
3. Be redirected back to [/assert](http://localhost:8082/assert)

If successful, you should see JSON output like:
```json
{
    "message": "SPID login successful",
    "vc": {
        "subject": "testuser@spid.it",
        "claim": "dummy VC"
    }
}
```

## ✅ 6. (Optional) Verify VC Signature
If you generate and return a signed VC JWT, you can verify it with:
```bash
    cd backend
    npx ts-node test/verifyVC.ts
```
> NOTE
> 
> Inside `test/verifyVC.ts` replace
>> const JWT = '...';
> 
> with the actual JWT you received from the SPID login flow (in `/assert`).

Expected output on success:
```bash
    ✅ VC is valid:
    { credentialSubject: ..., ... }
```

## 📌 Summary
| Component | URL                                            |
| --------: | ---------------------------------------------- |
|   Backend | [http://localhost:8082](http://localhost:8082) |
|  Mock IdP | [http://localhost:8443](http://localhost:8443) |

- Self-signed certs are used
- Accept browser warnings if prompted
- No external SPID infrastructure required

