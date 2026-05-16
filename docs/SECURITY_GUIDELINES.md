# SECURITY_GUIDELINES.md

## Prinsip

- Least privilege.
- Role-based access.
- Validasi file.
- Validasi input.
- Activity log.

## Larangan

- Jangan gunakan Firebase Storage untuk target Spark/free.
- Jangan simpan foto/audio/video sebagai base64 di Firestore.
- Jangan simpan secret API sensitif di frontend.

## File Validation

- MIME type.
- Ukuran file.
- Ekstensi file.
- Modul sumber file.
