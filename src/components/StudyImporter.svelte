<script>
  import { db } from "../modules/indexeddb.js";
  import { studyStore } from "../modules/store.js";
  import { onMount } from "svelte";
  onMount(() => {
    const el = document.getElementById("studyImport");

    el.onchange = () => {
      for (const file of el.files) {
        //console.log(file);
        if (file.type !== "application/json") {
          console.error("invalid file type");
          continue;
        }
        // read file contents
        const reader = new FileReader();
        console.log("importing file: ", file.name);
        reader.readAsText(file);
        reader.onload = e => {
          const text = reader.result;
          console.log("file reader finished importing");
          try {
            console.log("parsing json file: ", file.name);
            const jsn = JSON.parse(text);
            console.log("finished parsing file");
            console.log(jsn);
            // import study into database

            // check if it is a results file
            if (
              jsn.hasOwnProperty("taskResults") &&
              jsn.taskResults instanceof Array
            ) {
              let tx = db.transaction(
                ["Users", "Demographics", "TaskResults", "StudyTasks"],
                "readwrite"
              );

              // importing questionnaire results
              for (const result of jsn.taskResults) {
                const { studyId, taskId, userId, startDate } = result;
                const res = tx.objectStore("StudyTasks").get(taskId);
                res.onsuccess = e => {
                  const taskInfo = e.target.result;
                  if (taskInfo.personalData === true) {
                    // import data for demographics
                    const store = tx.objectStore("Demographics");
                    for (const step of result.stepResults) {
                      for (const stepItem of step.stepItemResults) {
                        const data = {
                          userId: userId,
                          variableName: stepItem.variableName,
                          taskId: taskId,
                          value: stepItem.value,
                          startDate: startDate, // using start date of questionnaire, should we use item date instead, or skip this value?
                          __created: new Date()
                        };
                        store.put(data);
                      }
                    }
                  } else {
                    // regular questionnaire item
                    const store = tx.objectStore("TaskResults");
                    for (const step of result.stepResults) {
                      for (const stepItem of step.stepItemResults) {
                        const data = {
                          studyId: studyId,
                          userId: userId,
                          taskId: taskId,
                          variableName: stepItem.variableName,
                          value: stepItem.value,
                          startDate: startDate, // using start date of questionnaire, should we use item date instead?
                          __created: new Date()
                        };
                        store.add(data);
                      }
                    }
                  }
                };

                let store = tx.objectStore("Users");
                const user = {
                  userId: result.userId,
                  studyId: studyId,
                  __created: new Date()
                };
                store.put(user);
              }
              alert("Study results were imported");
              return;
            } // end of task result import

            if (!jsn.hasOwnProperty("_id")) {
              // sanity checks:
              console.error("missing prop: _id");
              return;
            }
            if (!jsn.hasOwnProperty("studyName")) {
              console.error("missing prop: studyName");
              return;
            }
            if (!jsn.hasOwnProperty("description")) {
              console.error("missing prop: description");
              return;
            }

            // insert study data into db
            if (!db) {
              console.error("missing database object");
              return;
            }

            let tx = db.transaction(
              ["Studies", "StudyVariables", "StudyTasks"],
              "readwrite"
            );
            let storeName = "Studies";
            let store = tx.objectStore(storeName);

            jsn.__created = new Date();
            let result = store.add(jsn); // put replaces existing items in the db
            result.onerror = event => {
              // ConstraintError occurs when an object with the same id already exists
              if (result.error.name == "ConstraintError") {
                if (
                  confirm(
                    "This study already exists, do you want to replace it?"
                  )
                ) {
                  console.log("replace study");
                  event.preventDefault(); // don't abort the transaction
                  event.stopPropagation();
                  event.target.source.put(jsn); //source holds objectStore for this event
                  result.onsuccess();
                } else {
                  console.log("don't replace study");
                }
              }
            };
            result.onsuccess = () => {
              store = tx.objectStore("StudyVariables");
              const store2 = tx.objectStore("StudyTasks");

              const stId = jsn._id;
              for (const task of jsn.tasks) {
                const taskData = {
                  studyId: stId,
                  taskId: task._id,
                  taskName: task.taskName,
                  personalData: JSON.parse(task.personalData) // cast to boolean type
                };
                store2.put(taskData);
                for (const step of task.steps) {
                  for (const stepItem of step.stepItems) {
                    stepItem.__created = new Date();
                    stepItem.studyId = stId;
                    store.put(stepItem);
                  }
                }
              }

              // notify study store
              //FIXME: don't overwrite, just replace/add study in store?
              const res = tx.objectStore("Studies").getAll();
              res.onsuccess = e => studyStore.set(e.target.result);

              //alert(`Study "${jsn.studyName}" was successfully imported`);
            };
          } catch (error) {
            console.error(`Error parsing ${file.name}: `, error);
          }
        };
      }
    };
  });
</script>

<style>
  input {
    /* hide system input field since it's ugly can't be styled properly*/
    cursor: pointer;
    width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: -1;
  }
  label {
    width: 100%;
    height: 100%;
    background: tomato;
    text-align: center;
    position: absolute;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    overflow: hidden;
    padding: 1rem 1.25rem;
    border-radius: 0.25rem;
    color: white;
  }
  label:hover {
    background-color: #722040;
  }
</style>

<input id="studyImport" type="file" multiple accept="application/json" />
<label for="studyImport">
  <figure>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="2em"
      height="1.8em"
      viewBox="0 0 20 17">
      <path
        fill="white"
        d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3
        11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8
        2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6
        1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4
        1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z" />
    </svg>
  </figure>
    Upload study data
</label>
