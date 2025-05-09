/**
 *
 */
public with sharing class TaskChecklistPanelLWCController {
    /**
     *
     */
    @AuraEnabled
    public static List<Task> updateTaskStatuses(String caseId, String taskIds) {
        try {
            return TaskChecklistPanelController.updateTaskStatusById(
                caseId,
                (Set<String>) JSON.deserialize(taskIds, Set<String>.class)
            );
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     *
     */
    @AuraEnabled
    public static List<Task> getTasksForChecklist(Id caseId) {
        try {
            return TaskChecklistPanelController.getTasksByCaseId(caseId);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
