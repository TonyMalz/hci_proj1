const dbName = "senseQ"
const dbVersion = 1
const storeName = "esmstore1"

let request = window.indexedDB.open(dbName, dbVersion)
let db, tx, store, idx

// is only called once for each version number
request.onupgradeneeded = (e) => {
    db = e.target.result
    store = db.createObjectStore(storeName, { autoIncrement: true })
    store.createIndex("idx_name", "name", { unique: false })
}

request.onerror = (e) => {
    console.error("dberror: open db", e.target)
}

function globalError(e) {
    console.error("dberror", e.target);
}

// work with database here
request.onsuccess = (e) => {
    db = e.target.result
    db.onerror = globalError
    // start transaction
    tx = db.transaction(storeName, "readwrite")
    store = tx.objectStore(storeName)
    idx = store.index("idx_name")

    // store.put({ name: "Hans", type: true, age: 45 })
    // store.put({ name: "Dampf", type: false, age: 23 })

    const res = store.get(7);
    res.onsuccess = () => {
        console.log(res.result);
    }
    const res2 = idx.get("Hans")
    res2.onsuccess = (e) => {
        console.log(res2.result);
    }
    // close transaction
    tx.oncomplete = () => {
        db.close()
    }
    console.log("transaction complete");
}

