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
            let jsn = JSON.parse(text);
            console.log("finished parsing file");
            console.log(jsn);

            // --------------- import study into database
            // if it is not an array it only contains data of one study
            if (!(jsn instanceof Array)) {
              jsn = [jsn];
            }

            // import data of each study
            for (let exportData of jsn) {
              console.log("import study: ", exportData);
              // sanity checks:
              if (!exportData.hasOwnProperty("dataSchema")) {
                console.error("missing prop: dataSchema");
                return;
              }

              const study = exportData.dataSchema;
              if (!study.hasOwnProperty("_id")) {
                console.error("missing prop: _id");
                return;
              }
              if (!study.hasOwnProperty("studyName")) {
                console.error("missing prop: studyName");
                return;
              }
              if (!study.hasOwnProperty("description")) {
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
              let store = tx.objectStore("Studies");

              study.__created = new Date();
              let result = store.add(study);
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
                    event.target.source.put(study); //source holds objectStore for this event
                    result.onsuccess();
                  } else {
                    console.log("don't replace study");
                  }
                }
              };
              result.onsuccess = () => {
                store = tx.objectStore("StudyVariables");
                const store2 = tx.objectStore("StudyTasks");

                const stId = study._id;
                for (const task of study.tasks) {
                  const taskData = {
                    studyId: stId,
                    taskId: task._id,
                    taskName: task.taskName,
                    personalData: JSON.parse(task.personalData) // cast string "false" to boolean false
                  };

                  //Update StudyTasks
                  store2.put(taskData);

                  const typeMapping = new Map([
                    ["Numeric", "scale"],
                    ["TextChoice", "nominal"],
                    ["DiscreteScale", "ordinal"], // scale?
                    ["ContinuousScale", "scale"],
                    ["Text", "qualitative"]
                  ]);
                  //Update StudyVariables
                  for (const step of task.steps) {
                    for (const stepItem of step.stepItems) {
                      stepItem.__created = new Date();
                      stepItem.studyId = stId;
                      stepItem.measure = typeMapping.get(
                        stepItem.dataformat.type
                      );
                      store.put(stepItem);
                    }
                  }
                }

                // notify study store
                const res = tx.objectStore("Studies").getAll();
                //FIXME: don't overwrite, just replace/add study in store?
                res.onsuccess = e => studyStore.set(e.target.result);
              };

              // ---------- Import task results
              // check if there are any questionnaire results in the export file
              if (
                exportData.hasOwnProperty("taskResults") &&
                exportData.taskResults instanceof Array
              ) {
                let tx = db.transaction(
                  [
                    "Users",
                    "Demographics",
                    "TaskResults",
                    "StudyTasks",
                    "StudyResponses"
                  ],
                  "readwrite"
                );

                // importing questionnaire results
                for (const result of exportData.taskResults) {
                  // TODO: check if props exist
                  const { studyId, taskId, userId } = result;

                  //find task to which these results belong
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
                            __created: new Date()
                          };
                          store.put(data); // replace existing data
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
                            stepItem,
                            __created: new Date()
                          };
                          store.add(data);
                        }
                      }
                    }
                  };

                  // update users table
                  let store = tx.objectStore("Users");
                  const user = {
                    userId: result.userId,
                    studyId: studyId,
                    __created: new Date()
                  };
                  store.put(user);

                  // add response info
                  tx.objectStore("StudyResponses").put(result);
                } // for each taskResult

                // DONE
              } // end of task result import
              alert(`Study results for "${study.studyName}" were imported`);
            }
          } catch (error) {
            console.error(`Error importing ${file.name}: `, error);
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
    Import study data
</label>
