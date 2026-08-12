"""Push live dashboard state to Firestore so the Firebase-hosted dashboard can read it.

The engine (running on your machine) writes one document — `algo/dashboard` —
after every cycle using the Firebase Admin SDK, which bypasses security rules.
The hosted dashboard page subscribes to that document with the web SDK.

Setup: see README → "Host the dashboard on Firebase".
"""

import logging

log = logging.getLogger("firebase_sync")


class FirebaseSync:
    def __init__(self, service_account_path: str, document: str = "algo/dashboard"):
        import firebase_admin
        from firebase_admin import credentials, firestore

        collection, _, doc = document.partition("/")
        if not collection or not doc:
            raise ValueError(f"firebase.document must be 'collection/doc', got {document!r}")
        self.collection, self.doc = collection, doc

        cred = credentials.Certificate(service_account_path)
        try:
            app = firebase_admin.get_app()
        except ValueError:
            app = firebase_admin.initialize_app(cred)
        self.db = firestore.client(app)
        log.info("Firebase sync enabled (project %s, document %s)", cred.project_id, document)

    def publish(self, state: dict):
        try:
            self.db.collection(self.collection).document(self.doc).set(state)
        except Exception as e:
            log.warning("Firestore publish failed: %s", e)


def make_sync(settings):
    """Return a FirebaseSync if enabled in config, else None."""
    fb = settings.raw.get("firebase", {})
    if not fb.get("enabled"):
        return None
    path = fb.get("service_account", "serviceAccount.json")
    try:
        # Each engine needs its own document — several writing one path would
        # overwrite each other's state on every cycle.
        return FirebaseSync(path, fb.get("document", "algo/dashboard"))
    except Exception as e:
        log.error("Firebase sync disabled — could not initialize (%s). "
                  "Check firebase.service_account in config.yaml.", e)
        return None
