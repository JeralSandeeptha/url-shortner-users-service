import request from 'supertest';
import app from '../../..';
import SuccessResponse from '../../../utils/SuccessResponse';

describe('GET /api/v1/health', () => {
  it('should return 200 OK with status message', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    const mockResponse: SuccessResponse = {
        "data": "User Service API checking query was success",
        "message": "User Service API checking query was success",
        "statusCode": 200,
      }
    expect(response.body).toEqual(mockResponse);
  });
});
