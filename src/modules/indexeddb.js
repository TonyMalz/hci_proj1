const dbName = "senseQ"
const dbVersion = 1

let request = window.indexedDB.open(dbName, dbVersion)
export let db
let tx, store, idx

// is only called once for each version number
// init database with stores needed for application
request.onupgradeneeded = (e) => {
    db = e.target.result

    // Setup all stores

    // holds general study info
    store = db.createObjectStore("Studies", { keyPath: "_id" })
    store.createIndex("studyName", "studyName", { unique: false })

    // later used to quickly lookup task properties to distinguish btw. demographics and regular questions
    store = db.createObjectStore("StudyTasks", { keyPath: "taskId" })
    store.createIndex("studyId", "studyId", { unique: false })

    // later used to quickly lookup variable types
    store = db.createObjectStore("StudyVariables", { keyPath: ["variableName", "studyId"] })
    store.createIndex("variableName", "variableName", { unique: false })
    store.createIndex("studyId", "studyId", { unique: false })
    // store = db.createObjectStore("StudyVariables", { autoIncrement: true })
    // store.createIndex("studyId", "studyId", { unique: false })
    // store.createIndex("variableName", "variableName", { unique: false })

    // not sure if really needed
    store = db.createObjectStore("Users", { keyPath: ["userId", "studyId"] })
    store.createIndex("userId", "userId", { unique: false })
    store.createIndex("studyId", "studyId", { unique: false })

    // store holding all demographics of each user (where task.personalData == true)
    store = db.createObjectStore("Demographics", { keyPath: ["userId", "variableName"] })
    store.createIndex("userId", "userId", { unique: false })
    store.createIndex("variableName", "variableName", { unique: false })

    // holds all results from all questionnaires
    store = db.createObjectStore("TaskResults", { autoIncrement: true })
    store.createIndex("taskId", "taskId", { unique: false })
    store.createIndex("userId", "userId", { unique: false })
    store.createIndex("studyId", "studyId", { unique: false })
    store.createIndex("startDate", "startDate", { unique: false })
    store.createIndex("variableName", "variableName", { unique: false })

}

request.onerror = (e) => {
    console.error("indexedDb error: open db", e.target)
}

function globalError(e) {
    console.error(`indexedDb error: ${e.target.error.message}`, e.target);
}

// get database interface if opening was successful
request.onsuccess = (e) => {
    db = e.target.result
    db.onerror = globalError
    // start transaction
    // tx = db.transaction(storeName, "readwrite")
    // store = tx.objectStore(storeName)
    // idx = store.index("idx_name")

    // // store.put({ name: "Hans", type: true, age: 45 })
    // // store.put({ name: "Dampf", type: false, age: 23 })

    // const res = store.get(7);
    // res.onsuccess = () => {
    //     console.log(res.result);
    // }
    // const res2 = idx.get("Hans")
    // res2.onsuccess = (e) => {
    //     console.log(res2.result);
    // }
    // // close transaction
    // tx.oncomplete = () => {
    //     db.close()
    // }
    // console.log("transaction complete");
}

