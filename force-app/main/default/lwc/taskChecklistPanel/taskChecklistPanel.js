import { LightningElement, api, track } from "lwc";
import getChecklistData from "@salesforce/apex/TaskChecklistPanelLWCController.getTasksForChecklist";
import updateChecklist from "@salesforce/apex/TaskChecklistPanelLWCController.updateTaskStatuses";

export default class TaskChecklistPanel extends LightningElement {
  @api recordId; //  Case record Id

  @track taskList = []; // List of Tasks to be passed to the template for-loop
  @track progress = 0; // Value to be fed to the progress bar
  @track isSubmitBtnDisabled = false; // Used to disable the submit button while data is updated

  taskIdsToUpdate = [];

  /**
   * On load, get our lists of Tasks realted to the Case
   */
  connectedCallback() {
    getChecklistData({ caseId: this.recordId })
      .then((data) => {
        this.processData(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }

  /**
   * Process data as it comes in.  Update Labels with the completed date if completed
   * Updates the progress bar
   */
  processData(data) {
    this.taskList = data;

    //  If Task is completed, show the completion date from formula field
    for (const task of this.taskList) {
      task.Label = task.Subject;

      //  Add completed date to label, can look silly with longer Subject string lengths
      if (task.IsCompleted__c) {
        task.Label += " (" + task.CompletedDateFormula__c + ")";
      }
    }

    this.calculateProgress();
  }

  /**
   * Calcaulates the value to assign to the progress bar
   */
  calculateProgress() {
    const totalTasksCompleted = this.taskList.filter(
      (task) => task.IsCompleted__c
    ).length;

    this.progress =
      this.taskList.length === 0
        ? 0
        : (totalTasksCompleted / this.taskList.length) * 100;
  }

  /**
   * Called from a lightning-input: checkbox. If the box is now checked, adds the 'name' value (Task.Id)
   * to the taskIdsToUpdate stack. If the box is now unchecked, removes the 'name' value (Task.Id) from
   * the stack
   * @param {*} event
   */
  handleCheckboxChange(event) {
    const checkbox = event.target;

    if (checkbox.checked) {
      //  Add TaskId to list
      this.taskIdsToUpdate.push(checkbox.name);
      return;
    }

    //  Remove TaskId from list
    this.taskIdsToUpdate = this.taskIdsToUpdate.filter(
      (taskId) => taskId !== checkbox.name
    );
  }

  /**
   * If there are values to update, submit them to be set to Completed
   * then repopulate our data
   */
  handleUpdateTaskStatuses() {
    //  Nothing is selected, so don't do anything
    if (this.taskIdsToUpdate.length === 0) {
      return;
    }

    this.isSubmitBtnDisabled = true;

    updateChecklist({
      caseId: this.recordId,
      taskIds: JSON.stringify(this.taskIdsToUpdate),
    })
      .then((data) => {
        this.processData(data);
        //  We did the things, enable the Submit button and empty the update list
        this.isSubmitBtnDisabled = false;
        this.taskIdsToUpdate = [];
      })
      .catch((error) => {
        console.error("Error updating and fetching data:", error);
        this.isSubmitBtnDisabled = false;
      });
  }
}
