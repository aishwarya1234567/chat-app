const socket = io()

$messageForm = document.querySelector('#message-form')
$inputMessage = $messageForm.querySelector('input')
$messageSendButton = $messageForm.querySelector('button')
$sendLocationButton = document.querySelector('#sendLocation')
$messagesDiv = document.querySelector('#messages')
$messageTemplate = document.querySelector('#message-template').innerHTML
$locationTemplate = document.querySelector('#location-template').innerHTML
$sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix : true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messagesDiv.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messagesDiv.offsetHeight

    // Height of messages container
    const containerHeight = $messagesDiv.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messagesDiv.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messagesDiv.scrollTop = $messagesDiv.scrollHeight
    }
}


socket.on('message', (message)=>{
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm A')
    })
    $messagesDiv.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage', (message)=>{
    const html = Mustache.render($locationTemplate, {
        username: message.username,
        url : message.url,
        createdAt : moment(message.createdAt).format('hh:mm A')
    })
    $messagesDiv.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    $messageSendButton.setAttribute('disabled', 'disabled')
    const message = $inputMessage.value

    socket.emit('sendMessage', message, (error)=>{
        $messageSendButton.removeAttribute('disabled')
        $inputMessage.value = ''
        $inputMessage.focus()
        if(error)
        {
            return console.log(error)
        }
        console.log('Message has been sent!')
    })
})

$sendLocationButton.addEventListener('click', (e)=>{
    e.preventDefault()
    $sendLocationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation)
    {
        alert('Geolocation is not supported.')
    }

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, ()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location has been shared!')
        })
    })
})

socket.emit('join', {username, room}, (error)=>{
    if(error)
    {
        alert(error)
        location.href = "/"
    }
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})