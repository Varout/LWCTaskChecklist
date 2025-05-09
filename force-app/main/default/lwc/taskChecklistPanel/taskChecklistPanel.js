import { LightningElement, api, track } from "lwc";
import getChecklistData from "@salesforce/apex/TaskChecklistPanelLWCController.getTasksForChecklist";
import updateChecklist from "@salesforce/apex/TaskChecklistPanelLWCController.updateTaskStatuses";

export default class TaskChecklistPanel extends LightningElement {
  //  Case record Id
  @api recordId;

  @track taskList = [];
  @track progress = 0;
  @track isSubmitBtnDisabled = false;

  taskIdsToUpdate = [];

  /**
   *
   */
  connectedCallback() {
    getChecklistData({ caseId: this.recordId })
      .then((data) => {
        this.processData(data);
        this.calculateProgress();
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }

  /**
   *
   */
  processData(data) {
    this.taskList = data;

    //  If Task is completed, show the completion date from formula field
    for (const task of this.taskList) {
      task.Label = task.Subject;
      if (task.IsCompleted__c) {
        task.Label += " (" + task.CompletedDateFormula__c + ")";
      }
    }
  }

  /**
   *
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
        this.calculateProgress();
        //  We did the things, enable the Submit button and empty the update list
        this.isSubmitBtnDisabled = false;
        this.taskIdsToUpdate = [];
      })
      .catch((error) => {
        console.error("Error updating and fetching data:", error);
        this.isSubmitBtnDisabled = false;
      });
  }

  /**
   *
   */
  calculateProgress() {
    let totalTasksCompleted = 0;
    for (const task of this.taskList) {
      if (task.IsCompleted__c) {
        totalTasksCompleted++;
      }
    }

    this.progress = (totalTasksCompleted / this.taskList.length) * 100;
  }

  /**
   *
   * @param {*} event
   */
  handleCheckboxChange(event) {
    const checkbox = event.target;

    if (this.taskIdsToUpdate.includes(checkbox.name) && !checkbox.checked) {
      //  Remove TaskId from list
      this.taskIdsToUpdate = this.taskIdsToUpdate.filter(
        (taskId) => taskId !== checkbox.name
      );
    } else if (
      !this.taskIdsToUpdate.includes(checkbox.name) &&
      checkbox.checked
    ) {
      //  Add TaskId to list
      this.taskIdsToUpdate.push(checkbox.name);
    }
  }
}
