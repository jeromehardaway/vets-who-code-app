import { createMocks } from 'node-mocks-http'
import { mswServer, rest } from '@/mocks/msw-server'
import contactApiHandler from '@/api/contact'

describe('contact handler', () => {
  test('should return 200 and success message', async () => {
    const body = {
      name: 'Jody',
      email: 'jody@mail.com',
      phone: '111-111-1111',
      message: 'hello world',
    }

    const { req, res } = createMocks({
      method: 'POST',
      statusCode: 200,
      body: JSON.stringify(body),
    })

    await contactApiHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(res._getData()).toBe('{"message":"SUCCESS"}')
  })

  test('should return 422 error when parameters missing', async () => {
    const body = {
      name: 'Jody',
      email: '',
      phone_number: '111-111-1111',
      message: 'hello world',
    }

    const { req, res } = createMocks({
      method: 'POST',
      statusCode: 200,
      body: JSON.stringify(body),
    })

    await contactApiHandler(req, res)

    expect(res._getStatusCode()).toBe(422)
    expect(res._getData()).toBe('{"error":"Missing or incorrect required property"}')
  })

  test('should throw error when failing to complete post to slack api', async () => {
    // override default behaviour of handler use mock service worker to simulate a failed post to slack api
    mswServer.use(
      rest.post('https://hooks.slack.com/services/*', async (_, res, ctx) => {
        return res(ctx.status(500), ctx.json({}))
      })
    )

    const body = {
      name: 'Jody',
      email: 'jody@mail.com',
      phone: '111-111-1111',
      message: 'hello world',
    }

    const { req, res } = createMocks({
      method: 'POST',
      statusCode: 200,
      body: JSON.stringify(body),
    })

    await contactApiHandler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(res._getData()).toBe('{"message":"Failed post to #contact channel"}')
  })

  test('should throw a 400 error when the length of the message is too short', async () => {
    const body = {
      name: 'Jody',
      email: 'fake@email.com',
      phone_number: '111-111-1111',
      message: 'nope',
    }
    const { req, res } = createMocks({
      method: 'POST',
      statusCode: 200,
      body: JSON.stringify(body),
    })

    await contactApiHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(res._getData()).toBe('{"error":"Message is too short for submission"}')
  })
})
