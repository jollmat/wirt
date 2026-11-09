import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadChildren: () =>
        import('../app/modules/login/login-module')
            .then(m => m.LoginModule)
    },
    {
        path: 'dashboard',
        loadChildren: () =>
        import('../app/modules/dashboard/dashboard-module')
            .then(m => m.DashboardModule)
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
