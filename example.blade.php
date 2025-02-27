<!-- resources/views/components-admin-layout.blade.php -->
<!DOCTYPE html>
<html lang="pt">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ $title ?? 'Admin 3.0' }}</title>
        @vite('resources/css/admin.css')
        @if (request()->routeIs('news.create') ||
                request()->routeIs('news.edit') ||
                request()->routeIs('events.create') ||
                request()->routeIs('events.edit') ||
                request()->routeIs('centers.create') ||
                request()->routeIs('centers.edit'))
            <link rel="stylesheet" href="https://uicdn.toast.com/editor/latest/toastui-editor.css" />
        @endif

        <!--  Todo ADD ROUTES TO TAGIFY -->
        <script src="https://cdn.jsdelivr.net/npm/@yaireo/tagify"></script>
        <script src="https://cdn.jsdelivr.net/npm/@yaireo/tagify/dist/tagify.polyfills.min.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/@yaireo/tagify/dist/tagify.css" rel="stylesheet" type="text/css" />

        @stack('styles')
    </head>

    <body data-route="{{ Route::currentRouteName() }}">
        <header class="relative bg-white shadow-xs h-32 bg-linear-to-t from-slate-100 to-white">
            <div class="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
                <div
                    class="pointer-events-none absolute z-10 border border-red-300 start-0 -top-[600px] aspect-4/5 w-[800px] -rotate-45 rounded-full blur-3xl [background:linear-gradient(to_bottom_right,transparent,#22d3ee,#818cf8,#7dd3fc,transparent)] [mask-image:radial-gradient(closest-side,rgba(0,0,0,0.3),rgba(0,0,0,0))]">
                </div>
            </div>

            <div class="flex items-center absolute top-6 left-6 z-20">
                <div class="mr-2.5 text-slate-600/40">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
                        <path fill-rule="evenodd"
                            d="M12 6.75a5.25 5.25 0 0 1 6.775-5.025.75.75 0 0 1 .313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 0 1 1.248.313 5.25 5.25 0 0 1-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 1 1 2.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0 1 12 6.75ZM4.117 19.125a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z"
                            clip-rule="evenodd" />
                        <path
                            d="m10.076 8.64-2.201-2.2V4.874a.75.75 0 0 0-.364-.643l-3.75-2.25a.75.75 0 0 0-.916.113l-.75.75a.75.75 0 0 0-.113.916l2.25 3.75a.75.75 0 0 0 .643.364h1.564l2.062 2.062 1.575-1.297Z" />
                        <path fill-rule="evenodd"
                            d="m12.556 17.329 4.183 4.182a3.375 3.375 0 0 0 4.773-4.773l-3.306-3.305a6.803 6.803 0 0 1-1.53.043c-.394-.034-.682-.006-.867.042a.589.589 0 0 0-.167.063l-3.086 3.748Zm3.414-1.36a.75.75 0 0 1 1.06 0l1.875 1.876a.75.75 0 1 1-1.06 1.06L15.97 17.03a.75.75 0 0 1 0-1.06Z"
                            clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="flex flex-col">
                    <a href="{{ route('admin.index') }}"
                        class="text-lg uppercase text-slate-600 hover:text-black transition">{{ config('app.name') }}</a>
                    <div class="text-sm uppercase text-slate-400/80 -mt-1">{{ __('admin.admin_area') }}</div>
                </div>
            </div>

            <div class="flex items-center absolute top-7 right-6 text-right z-20">
                <form method="POST" action="{{ route('admin.logout') }}" class="inline">
                    @csrf
                    <button type="submit"
                        class="flex items-center uppercase text-xs text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 py-2 px-3.5 rounded-lg transition">{{ __('admin.logout') }}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="w-4 h-4 ml-2"
                            viewBox="0 0 512 512">
                            <path
                                d="M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z" />
                        </svg>
                    </button>
                </form>
            </div>

            <div
                class="absolute bottom-0 border border-white border-b-0 left-6 right-6 h-10 bg-white/50 rounded-t flex backdrop-blur-md z-50">

                <div class="relative group">
                    <a class="menu-header-item rounded-t {{ request()->routeIs('centers.*') ? 'active' : '' }}"
                        href="{{ route('centers.index') }}" data-dropdown-toggle>
                        <svg class="w-3 h-3 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                                clip-rule="evenodd" />
                        </svg>{{ __('admin.centers') }}</a>
                    <div class="submenu-header" data-dropdown-menu>
                        <a href="{{ route('centers.index') }}">{{ __('admin.back_to_centers') }}</a>
                        <a href="{{ route('centers.create') }}">{{ __('admin.add_center') }}</a>
                    </div>
                </div>

                <div class="relative group">
                    <a class="menu-header-item rounded-t {{ request()->routeIs('news.*') ? 'active' : '' }}"
                        href="{{ route('news.index') }}" data-dropdown-toggle>
                        <svg class="w-3 h-3 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                                clip-rule="evenodd" />
                        </svg>{{ __('admin.news') }}</a>
                    <div class="submenu-header" data-dropdown-menu>
                        <a href="{{ route('news.index') }}">{{ __('admin.back_to_news') }}</a>
                        <a href="{{ route('news.create') }}">{{ __('admin.add_news') }}</a>
                        <hr class="my-2 border-slate-100" />
                        <a href="{{ route('news.categories.index') }}">{{ __('admin.categories') }}</a>
                    </div>
                </div>

                <div class="relative group">
                    <a class="menu-header-item rounded-t {{ request()->routeIs('events.*') ? 'active' : '' }}"
                        href="{{ route('events.index') }}" data-dropdown-toggle>
                        <svg class="w-3 h-3 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                                clip-rule="evenodd" />
                        </svg>{{ __('admin.events') }}</a>
                    <div class="submenu-header" data-dropdown-menu>
                        <a href="{{ route('events.index') }}">{{ __('admin.back_to_events') }}</a>
                        <a href="{{ route('events.create') }}">{{ __('admin.add_event') }}</a>
                        <hr class="my-2 border-slate-100" />
                        <a href="{{ route('events.categories.index') }}">{{ __('admin.categories') }}</a>
                    </div>
                </div>

                <div class="relative group">
                    <a class="menu-header-item rounded-t {{ request()->routeIs('users.*') ? 'active' : '' }}"
                        href="{{ route('users.index') }}" data-dropdown-toggle>
                        <svg class="w-3 h-3 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                                clip-rule="evenodd" />
                        </svg>{{ __('admin.users') }}</a>
                    <div class="submenu-header" data-dropdown-menu>
                        <a href="{{ route('users.index') }}">{{ __('admin.back_to_users') }}</a>
                        <a href="{{ route('users.create') }}">{{ __('admin.add_user') }}</a>
                    </div>
                </div>

                <a class="menu-header-item rounded-t {{ request()->routeIs('sitemap.index') ? 'active' : '' }}"
                    href="{{ route('sitemap.index') }}">{{ __('admin.sitemap') }}</a>
            </div>
        </header>

        <main>
            {{ $slot }}
        </main>

        @vite('resources/js/admin.js')
        @stack('scripts')
    </body>

</html>
