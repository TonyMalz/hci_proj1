import { studyStore, variableStore, tabStore, responseStore, userStore } from './store.js'
export const dbName = "senseQ"
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
    store.createIndex("created", "__created", { unique: false })

    // later used to quickly lookup task properties to distinguish btw. demographics and regular questions
    store = db.createObjectStore("StudyTasks", { keyPath: "taskId" })
    store.createIndex("studyId", "studyId", { unique: false })

    // later used to quickly lookup variable types
    store = db.createObjectStore("StudyVariables", { keyPath: ["variableName", "studyId"] })
    store.createIndex("variableName", "variableName", { unique: false })
    store.createIndex("studyId", "studyId", { unique: false })
    store.createIndex("measure", "measure", { unique: false })
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
    store.createIndex("resultVariable", "resultVariable", { unique: false })
    store.createIndex("resultDate", "resultDate", { unique: false })

    // holds all details on study responses
    store = db.createObjectStore("StudyResponses", { keyPath: ["userId", "studyId", "startDate"] })
    store.createIndex("userId", "userId", { unique: false })
    store.createIndex("studyId", "studyId", { unique: false })
    store.createIndex("taskId", "taskId", { unique: false })

    // used to store opened UI Tabs
    store = db.createObjectStore("UITabs", { keyPath: "id" })
    // types: home, overview, detailview, descriptives, customview
    store.put({ title: "Home", type: "home", studyId: null, id: 0 })
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

    // // get current studies (order by date imported asc)
    // const res = db.transaction("Studies").objectStore("Studies").index("created").openCursor(null, "next")
    // res.onsuccess = (e) => {
    //     const cursor = e.target.result;
    //     if (cursor) {
    //         studyStore.update(studies => [...studies, cursor.value]);
    //         cursor.continue()
    //     }
    // }

    // get current studies
    db.transaction("Studies").objectStore("Studies").getAll().onsuccess = (e) => {
        studyStore.set(e.target.result);
    }
    db.transaction("StudyVariables").objectStore("StudyVariables").getAll().onsuccess = e => {
        variableStore.set(e.target.result)
    }
    db.transaction("UITabs").objectStore("UITabs").getAll().onsuccess = e => {
        tabStore.set(e.target.result)
    }
    db.transaction("StudyResponses").objectStore("StudyResponses").getAll().onsuccess = e => {
        responseStore.set(e.target.result)
    }
    db.transaction("Users").objectStore("Users").getAll().onsuccess = e => {
        userStore.set(e.target.result)
    }
}

