import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth.guards';
import { LoginComponent } from './pages/login/login.component';
import { ShellComponent } from './pages/shell/shell.component';
import { TodayComponent } from './pages/today/today.component';
import { RecipesComponent } from './pages/recipes/recipes.component';
import { FoodsComponent } from './pages/foods/foods.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { GroceryComponent } from './pages/grocery/grocery.component';
import { GoalsComponent } from './pages/goals/goals.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'today', pathMatch: 'full' },
      { path: 'today', component: TodayComponent },
      { path: 'recipes', component: RecipesComponent },
      { path: 'foods', component: FoodsComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'grocery', component: GroceryComponent },
      { path: 'goals', component: GoalsComponent },
      { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
    ],
  },
  { path: '**', redirectTo: '' },
];
