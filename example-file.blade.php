@foreach($users as $user)


    <li>{{ $user->name }}</li>

    @break($user->number == 5)
@endforeach