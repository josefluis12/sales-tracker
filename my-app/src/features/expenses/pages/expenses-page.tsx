import { CrudPage } from "../../../components/common/crud-page"
import { EXPENSE_CATEGORIES } from "../../../constants/expense-categories"
import { todayIsoDate } from "../../../lib/utils"
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../services/expenses-service"
import type { Expense, ExpenseFormValues } from "../types"

const initialValues: ExpenseFormValues = {
  expense_date: todayIsoDate(),
  category: "other",
  amount: 0,
}

export function ExpensesPage() {
  return (
    <CrudPage<Expense, ExpenseFormValues>
      title="Expenses"
      description="Record rent, fuel, salary, utilities, maintenance, inventory, and other costs."
      createLabel="Add Expense"
      emptyMessage="No expenses recorded yet."
      initialValues={initialValues}
      fields={[
        { name: "expense_date", label: "Expense date", type: "date", required: true },
        {
          name: "category",
          label: "Category",
          type: "select",
          required: true,
          options: EXPENSE_CATEGORIES,
        },
        { name: "amount", label: "Amount", type: "number", required: true },
      ]}
      columns={[
        { key: "expense_date", label: "Date", format: "date" },
        { key: "category", label: "Category", format: "label" },
        { key: "amount", label: "Amount", format: "currency" },
      ]}
      getRecords={getExpenses}
      createRecord={createExpense}
      updateRecord={updateExpense}
      deleteRecord={deleteExpense}
    />
  )
}
