# EXPLAIN (ANALYZE, BUFFERS) — الشكل الجديد (GROUP BY per conversation، سقف 5000)

نُفِّذ read-only على قاعدة الإنتاج في ٢٥/١١/٢٠٢٦ (نفس اليوم/البيانات) على الشكل اللي اتنشر في
`conversationSearchWhere.js` (tenant filter جوّه الـCTE + MAX(createdAt) + ORDER BY lastHitAt).

الناتج الخام:

```
QUERY PLAN                                                                                       
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=5333.73..5780.52 rows=32 width=33) (actual time=603.148..621.261 rows=1860 loops=1)
   Buffers: shared hit=73321
   ->  Nested Loop  (cost=5333.73..5780.52 rows=32 width=33) (actual time=603.147..621.049 rows=1860 loops=1)
         Buffers: shared hit=73321
         ->  Limit  (cost=5333.31..5333.74 rows=173 width=34) (actual time=603.084..603.665 rows=1860 loops=1)
               Buffers: shared hit=65881
               ->  Sort  (cost=5333.31..5333.74 rows=173 width=34) (actual time=603.083..603.453 rows=1860 loops=1)
                     Sort Key: (max(m."createdAt")) DESC
                     Sort Method: quicksort  Memory: 179kB
                     Buffers: shared hit=65881
                     ->  GroupAggregate  (cost=5323.85..5326.88 rows=173 width=34) (actual time=601.130..602.299 rows=1860 loops=1)
                           Group Key: m."conversationId"
                           Buffers: shared hit=65878
                           ->  Sort  (cost=5323.85..5324.28 rows=173 width=34) (actual time=601.116..601.294 rows=2275 loops=1)
                                 Sort Key: m."conversationId"
                                 Sort Method: quicksort  Memory: 239kB
                                 Buffers: shared hit=65878
                                 ->  Nested Loop  (cost=375.55..5317.42 rows=173 width=34) (actual time=55.649..594.642 rows=2275 loops=1)
                                       Buffers: shared hit=65875
                                       ->  Bitmap Heap Scan on messages m  (cost=375.13..3120.77 rows=947 width=34) (actual time=48.012..490.145 rows=7804 loops=1)
                                             Recheck Cond: (content ~~* '%المقاسات%'::text)
                                             Rows Removed by Index Recheck: 67
                                             Filter: ("createdAt" >= (now() - '180 days'::interval))
                                             Rows Removed by Filter: 31390
                                             Heap Blocks: exact=33986
                                             Buffers: shared hit=34655
                                             ->  Bitmap Index Scan on idx_messages_content_trgm  (cost=0.00..374.89 rows=2468 width=0) (actual time=36.872..36.873 rows=39293 loops=1)
                                                   Index Cond: (content ~~* '%المقاسات%'::text)
                                                   Buffers: shared hit=640
                                       ->  Index Scan using conversations_pkey on conversations c2  (cost=0.42..2.32 rows=1 width=25) (actual time=0.013..0.013 rows=0 loops=7804)
                                             Index Cond: (id = m."conversationId")
                                             Filter: (("companyId" = 'cmleybpf70028juo2wwpmp8rt'::text) AND (channel = 'FACEBOOK'::text))
                                             Rows Removed by Filter: 1
                                             Buffers: shared hit=31220
         ->  Index Scan using conversations_pkey on conversations c  (cost=0.42..2.57 rows=1 width=25) (actual time=0.009..0.009 rows=1 loops=1860)
               Index Cond: (id = m."conversationId")
               Filter: (("companyId" = 'cmleybpf70028juo2wwpmp8rt'::text) AND (channel = 'FACEBOOK'::text))
               Buffers: shared hit=7440
 Planning:
   Buffers: shared hit=531
 Planning Time: 7.086 ms
 Execution Time: 622.253 ms
(42 rows)
```
